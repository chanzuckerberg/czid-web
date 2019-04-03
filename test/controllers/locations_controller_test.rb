require "test_helper"
require "minitest/mock"

class LocationsControllerTest < ActionDispatch::IntegrationTest
  setup do
    @user = users(:joe)
    @user_params = { "user[email]" => @user.email, "user[password]" => "passwordjoe" }
    @api_response = true, [
      {
        "lat" => "37.76",
        "lon" => "-122.45",
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
        "lat" => "37.76",
        "lon" => "-122.45"
      }
    ]
    @api_key_error = { "status" => "failed", "message" => "Unable to perform geosearch", "errors" => ["No API key for geosearch"] }
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
    end
  end

  test "user can geosearch and see an error" do
    post user_session_path, params: @user_params
    get external_search_locations_path, params: { query: "UCSF" }
    assert_response :error
    assert_equal JSON.dump(@api_key_error), @response.body
  end
end
