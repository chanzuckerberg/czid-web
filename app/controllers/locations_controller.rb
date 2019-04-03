class LocationsController < ApplicationController
  def external_search
    query = location_params[:query]
    render(json: []) && return if query.blank?

    results = []
    resp = Location.geosearch(query)

    if resp.is_a?(Net::HTTPSuccess)
      candidates = JSON.parse(resp.body)
      candidates.each do |c|
        name_parts = c["display_name"].partition(", ")
        results << {
          title: name_parts[0],
          description: name_parts[-1],
          country: c["address"]["country"] || "",
          state: c["address"]["state"] || "",
          county: c["address"]["county"] || "",
          city: c["address"]["city"] || "",
          lat: c["lat"] || "",
          lon: c["lon"] || ""
        }
      end
    end
    render json: results
  rescue => err
    render json: {
      status: "failed",
      message: "Unable to perform geosearch",
      errors: [err]
    }, status: :internal_server_error
  end

  private

  def location_params
    params.permit(:query)
  end
end
