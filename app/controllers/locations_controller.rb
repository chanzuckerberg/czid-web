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

    # For the samples with a location, get the location fields. Format as location hashes with lists
    # of sample_ids, keyed by location_id.
    location_fields = [:name, :geo_level, :country_name, :state_name, :subdivision_name, :city_name, :lat, :lng]
    location_data = samples
                    .includes(metadata: [:location, :metadata_field])
                    .where(metadata: { metadata_fields: { name: "collection_location_v2" } })
                    .where.not(metadata: { location_id: nil })
                    .pluck(:location_id, :id, *location_fields.map { |f| "locations.#{f}" })
                    .map { |p| [:location_id, :sample_id, *location_fields].zip(p).to_h }
                    .group_by { |h| h[:location_id] }.values.map { |v| v[0].merge(sample_ids: v.map { |h| h[:sample_id] }) }
                    .index_by { |s| s[:location_id] }

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
