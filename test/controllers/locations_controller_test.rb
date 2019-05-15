require "test_helper"
require "minitest/mock"

class LocationsControllerTest < ActionDispatch::IntegrationTest
  setup do
    @user = users(:admin) # Change to non-admin user once released
    @user_params = { "user[email]" => @user.email, "user[password]" => "password" }
    @api_response = true, [
      {
        "place_id" => "89640023",
        "osm_type" => "way",
        "osm_id" => "34324395",
        "lat" => 37.76,
        # LocationIQ uses 'lon'
        "lon" => -122.45,
        "display_name" => "University of California, San Francisco, Parnassus Avenue, Inner Sunset, San Francisco, San Francisco City and County, California, 94131, USA",
        "address" => {
          "city" => "San Francisco",
          "county" => "San Francisco City and County",
          "state" => "California",
          "country" => "USA",
          "country_code" => "us"
        }
      }
    ]
    @our_results = [
      {
        "name" => "University of California, San Francisco, Parnassus Avenue, Inner Sunset, San Francisco, San Francisco City and County, California, 94131, USA",
        "geo_level" => "city",
        "country_name" => "USA",
        "state_name" => "California",
        "subdivision_name" => "San Francisco City and County",
        "city_name" => "San Francisco",
        "lat" => 37.76,
        "lng" => -122.45,
        "country_code" => "us",
        "osm_id" => 34_324_395,
        "osm_type" => "way",
        "locationiq_id" => 89_640_023
      }
    ]
  end

  test "user can geosearch with results" do
    post user_session_path, params: @user_params

    Location.stub :geosearch, @api_response do
      get external_search_locations_path, params: { query: "UCSF" }
      assert_response :success
      assert_equal JSON.dump(@our_results), @response.body
    end
  end

  test "user can geosearch without results" do
    post user_session_path, params: @user_params

    Location.stub :geosearch, [true, []] do
      get external_search_locations_path, params: { query: "ahsdlfkjasfk" }
      assert_response :success
      assert_equal "[]", @response.body

      get external_search_locations_path, params: { query: "" }
      assert_response :success
      assert_equal "[]", @response.body

      get external_search_locations_path
      assert_response :success
      assert_equal "[]", @response.body
    end
  end

  test "user can geosearch and see an error" do
    post user_session_path, params: @user_params
    get external_search_locations_path, params: { query: "UCSF" }
    assert_response :error
    assert_equal LocationsController::GEOSEARCH_ERR_MSG, JSON.parse(@response.body)["message"]
  end

  test "user can see their map playground results" do
    # TODO: Use non-admin user once released
    post user_session_path, params: @user_params
    get map_playground_locations_path, as: :json

    assert_response :success
    results = JSON.parse(@response.body)
    assert results.count == 2
    assert_includes results.pluck("location"), metadata(:sample_joe_collection_location).string_validated_value
  end

  test "user can see a map playground error" do
    post user_session_path, params: @user_params
    MetadataField.stub :find_by, nil do
      get map_playground_locations_path, as: :json
      assert_response :error
      assert_equal LocationsController::LOCATION_LOAD_ERR_MSG, JSON.parse(@response.body)["message"]
    end
  end

  # TODO: Uncomment and use non-admin user once released
  # test "joe cannot see someone else's private map playground results" do
  #   post user_session_path, params: @user_params
  #   get map_playground_locations_path, as: :json
  #
  #   assert_response :success
  #   results = JSON.parse(@response.body).map { |r| r["location"] }
  #   assert_not results.include?(metadata(:sample_collection_location).string_validated_value)
  # end
end
