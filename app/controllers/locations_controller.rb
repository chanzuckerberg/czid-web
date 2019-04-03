class LocationsController < ApplicationController
  def external_search
    results = []
    query = location_params[:query]
    if query.present?
      success, resp = Location.geosearch(query)
      if success
        resp.each do |c|
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
