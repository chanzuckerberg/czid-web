class LocationsController < ApplicationController
  include LocationHelper
  include SamplesHelper

  GEOSEARCH_ERR_MSG = "Unable to perform geosearch".freeze
  LOCATION_LOAD_ERR_MSG = "Unable to load sample locations".freeze

  def external_search
    unless feature_access?
      render(json: {
               status: :unauthorized,
               message: "No feature access"
             }, status: :unauthorized) && return
    end

    results = []
    query = location_params[:query]
    if query.present?
      success, resp = Location.geosearch(query)
      if success
        results = resp.map { |r| LocationHelper.adapt_location_iq_response(r) }
        # Just keep the first if you get duplicate locations
        results = results.uniq { |r| [r[:name], r[:geo_level], r[:lat], r[:lng]] }
      end
    end
    event = MetricUtil::ANALYTICS_EVENT_NAMES[:location_geosearched]
    MetricUtil.log_analytics_event(event, current_user, { query: query }, request)
    render json: results
  rescue => err
    render json: {
      status: "failed",
      message: GEOSEARCH_ERR_MSG,
      errors: [err]
    }, status: :internal_server_error
  end

  def map_playground
    unless feature_access?
      render(json: {
               status: :unauthorized,
               message: "No feature access"
             }, status: :unauthorized) && return
    end

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
      errors: [err]
    }, status: :internal_server_error
  end

  # GET /locations/sample_locations.json
  # Get location data for a set of samples with filters
  # TODO(jsheu): Consider consolidating if similar location data is loaded w/ data discovery tables.
  def sample_locations
    unless feature_access?
      render(json: {
               status: :unauthorized,
               message: "No feature access"
             }, status: :unauthorized) && return
    end

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
                              .merge(project_ids: v.map { |h| h[:project_id] }.uniq)]
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
      errors: [err]
    }, status: :internal_server_error
  end

  private

  def location_params
    params.permit(:query)
  end

  def feature_access?
    current_user.admin? || current_user.allowed_feature_list.include?("maps")
  end
end
