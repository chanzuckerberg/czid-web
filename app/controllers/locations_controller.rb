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

  def samples_locations
    domain = location_params[:domain]
    param_sample_ids = (location_params[:sampleIds] || []).map(&:to_i)

    # Access control enforced within samples_by_domain
    samples = samples_by_domain(domain)
    unless param_sample_ids.empty?
      samples = samples.where(id: param_sample_ids)
    end

    # Get the relevant location_ids and sample_ids
    field_id = MetadataField.find_by(name: "collection_location_v2").id
    sample_info = samples
                  .includes(metadata: :metadata_field)
                  .where(metadata: { metadata_field_id: field_id })
                  .where.not(metadata: { location_id: nil })
                  .pluck(:location_id, :id)

    # Get all the location attributes
    location_ids = sample_info.map(&:first).uniq
    fields = [:id, :name, :geo_level, :country_name, :state_name, :subdivision_name, :city_name, :lat, :lng]
    location_data = Location.where(id: location_ids).pluck(*fields).map { |p| fields.zip(p).to_h }.index_by { |loc| loc[:id] }

    # Add list of sample_ids to each location
    sample_info.each do |s|
      entry = location_data[s[0]]
      if entry.key?(:sample_ids)
        entry[:sample_ids].push(s[1])
      else
        entry[:sample_ids] = [s[1]]
      end
    end

    respond_to do |format|
      format.json do
        render json: location_data
      end
    end
  end

  private

  def location_params
    params.permit(:query, :domain, :sampleIds)
  end

  def feature_access?
    current_user.admin? || current_user.allowed_feature_list.include?("maps")
  end
end
