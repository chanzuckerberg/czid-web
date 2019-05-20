require "test_helper"
require "minitest/mock"

class LocationsControllerTest < ActionDispatch::IntegrationTest
  setup do
    @user = users(:joe)
    @user_params = { "user[email]" => @user.email, "user[password]" => "password" }
    @api_response = true, [
      {
        "lat" => 37.76,
        "lng" => -122.45,
        "display_name" => "University of California, San Francisco, Parnassus Avenue, Inner Sunset, San Francisco, San Francisco City and County, California, 94131, USA",
        "address" => {
          "city" => "San Francisco",
          "county" => "San Francisco City and County",
          "state" => "California",
          "country" => "USA"
        }
      }
    ]
    @our_results = [
      {
        "title" => "University of California",
        "description" => "San Francisco, Parnassus Avenue, Inner Sunset, San Francisco, San Francisco City and County, California, 94131, USA",
        "country" => "USA",
        "state" => "California",
        "county" => "San Francisco City and County",
        "city" => "San Francisco",
        "lat" => 37.76,
        "lng" => -122.45
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
    post user_session_path, params: @user_params
    get map_playground_locations_path, as: :json

    assert_response :success
    results = JSON.parse(@response.body)
    assert results.count == 1
    assert_equal metadata(:sample_joe_collection_location).string_validated_value, results[0]["location"]
  end

  test "user can see a map playground error" do
    post user_session_path, params: @user_params
    MetadataField.stub :find_by, nil do
      get map_playground_locations_path, as: :json
      assert_response :error
      assert_equal LocationsController::LOCATION_LOAD_ERR_MSG, JSON.parse(@response.body)["message"]
    end
  end

  test "joe cannot see someone else's private map playground results" do
    post user_session_path, params: @user_params
    get map_playground_locations_path, as: :json

    assert_response :success
    results = JSON.parse(@response.body).map { |r| r["location"] }
    assert_not results.include?(metadata(:sample_collection_location).string_validated_value)
  end
end
