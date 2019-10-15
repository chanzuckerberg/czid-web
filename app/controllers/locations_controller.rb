class LocationsController < ApplicationController
  include LocationHelper
  include SamplesHelper

  GEOSEARCH_ERR_MSG = "Unable to perform geosearch".freeze
  GEOSEARCH_RATE_LIMIT_ERR = "Geosearch failed. Check API rate limits".freeze
  LOCATION_LOAD_ERR_MSG = "Unable to load sample locations".freeze

  TOKEN_AUTH_ACTIONS = [:external_search].freeze
  GEOSEARCH_ACTIONS = [:geo_autocomplete, :geosearch].freeze

  prepend_before_action :authenticate_user_from_token!, only: TOKEN_AUTH_ACTIONS

  def external_search
    results = []
    query = location_params[:query]
    limit = location_params[:limit]

    if query.present?
      responses = {}
      threads = []
      GEOSEARCH_ACTIONS.each do |action|
        t = Thread.new { external_search_action(action, query, limit, responses) }
        # Suppress verbose backtrace on handled exceptions
        t.report_on_exception = false
        threads << t
      end
      threads.each(&:join)

      if responses.present?
        results = handle_external_search_results(responses)
      end
    end

    event = MetricUtil::ANALYTICS_EVENT_NAMES[:location_geosearched]
    MetricUtil.log_analytics_event(event, current_user, { query: query }, request)
    render json: results
  rescue => err
    render json: {
      status: "failed",
      message: GEOSEARCH_ERR_MSG,
      errors: [err],
    }, status: :internal_server_error
  end

  def map_playground
    # Show all viewable locations in a demo format
    field_id = MetadataField.find_by(name: "collection_location_v2").id
    sample_info = current_power.samples
                               .includes(metadata: :metadata_field)
                               .where(metadata: { metadata_field_id: field_id })
                               .where.not(metadata: { location_id: nil })
                               .pluck(:id, :name, :location_id)
    @results = sample_info.map { |s| { id: s[0], name: s[1], location_validated_value: Location.find(s[2]).attributes } }

    respond_to do |format|
      format.html { render :map_playground }
      format.json { render json: @results }
    end
  rescue => err
    render json: {
      status: "failed",
      message: LOCATION_LOAD_ERR_MSG,
      errors: [err],
    }, status: :internal_server_error
  end

  # GET /locations/sample_locations.json
  # Get location data for a set of samples with filters
  # TODO(jsheu): Consider consolidating if similar location data is loaded w/ data discovery tables.
  def sample_locations
    # Get the samples
    domain = params[:domain]
    samples = samples_by_domain(domain) # access controlled
    samples = filter_samples(samples, params)

    # (a) Filter to samples with collection_location_v2 and non-nil location_id.
    # (b) Pluck location_id, id, and location fields.
    # (c) Map and zip the fields to a hash to convert the plucked array to an object with keys.
    # (d) Group and key by the location_id.
    # (e) Add lists of sample_ids and project_ids to the location attributes.
    #
    # Final result is a hash of hashes for frontend lookups.
    location_data = samples
                    .includes(metadata: [:location, :metadata_field])
                    .where(metadata: { metadata_fields: { name: "collection_location_v2" } })
                    .where.not(metadata: { location_id: nil })
                    .pluck(:location_id, :id, :project_id, *Location::DEFAULT_LOCATION_FIELDS.map { |f| "locations.#{f}" })
                    .map { |p| [:id, :sample_id, :project_id, *Location::DEFAULT_LOCATION_FIELDS].zip(p).to_h }
                    .group_by { |h| h[:id] }
                    .map do |k, v|
                      [k, v[0].except(:sample_id, :project_id)
                              .merge(sample_ids: v.map { |h| h[:sample_id] })
                              .merge(project_ids: v.map { |h| h[:project_id] }.uniq),]
                    end.to_h

    # Supply extra Country and State entries for bubble clustering
    extra_parent_ids = location_data.values.map { |h| [h[:country_id], h[:state_id]] }.flatten.uniq - location_data.keys
    extra_parents = Location
                    .where(id: extra_parent_ids)
                    .pluck(:id, *Location::DEFAULT_LOCATION_FIELDS)
                    .map { |p| [:id, *Location::DEFAULT_LOCATION_FIELDS].zip(p).to_h }
                    .group_by { |h| h[:id] }
                    .transform_values { |v| v[0] }
    location_data = location_data.merge(extra_parents)

    respond_to do |format|
      format.json do
        render json: location_data
      end
    end
  rescue => err
    render json: {
      status: "failed",
      message: LOCATION_LOAD_ERR_MSG,
      errors: [err],
    }, status: :internal_server_error
  end

  private

  def location_params
    params.permit(:query, :limit)
  end

  def external_search_action(action, query, limit, results)
    unless GEOSEARCH_ACTIONS.include?(action)
      raise "Action not allowed"
    end

    success, resp = Location.public_send(action, query, limit)

    if success && resp.is_a?(Array)
      results[action] = resp
    elsif success && resp.is_a?(Hash) && resp["error"] == "Unable to geocode"
      # Successful request but 0 results
      Rails.logger.info("No #{action} results for: #{query}")
    else
      # Unsuccessful request. Likely Net::HTTPTooManyRequests.
      # Monitor if users run up against geosearch API rate limits / record any other errs.
      msg = GEOSEARCH_RATE_LIMIT_ERR
      msg += ": #{resp}" if resp
      LogUtil.log_err_and_airbrake(msg)
      raise msg
    end
  end

  def handle_external_search_results(results)
    # Combine results from provider autocomplete and geosearch endpoints for better results.
    # Interpolate both lists (#1 from autocomplete, #1 from geosearch, #2 from autocomplete, #2
    # from geosearch, etc).
    autocomplete_results = results[GEOSEARCH_ACTIONS[0]] || []
    search_results = results[GEOSEARCH_ACTIONS[1]] || []
    combined = autocomplete_results.zip(search_results).flatten.compact

    # - NOTE(jsheu): We get much more relevant results from the 'relation' type, although we don't
    # have a way to solely request those. OSM relations are used to model logical or geographic
    # relationships between objects.
    # - De-dup by name/geo_level and also osm_id.
    combined
      .map { |r| LocationHelper.adapt_location_iq_response(r) }
      .select { |r| Location::OSM_SEARCH_TYPES_TO_USE.include?(r[:osm_type]) }
      .uniq { |r| [r[:name], r[:geo_level]] }
      .uniq { |r| r[:osm_id] }
  end
end
