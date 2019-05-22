require "test_helper"
require "minitest/mock"
require "test_helpers/location_test_helper"

class LocationsControllerTest < ActionDispatch::IntegrationTest
  setup do
    @user = users(:admin) # Change to non-admin user once released
    @user_params = { "user[email]" => @user.email, "user[password]" => "password" }
    @api_response = true, LocationTestHelper::API_GEOSEARCH_RESPONSE
    @our_results = LocationTestHelper::FORMATTED_GEOSEARCH_RESPONSE
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
    ENV["LOCATION_IQ_API_KEY"] = nil
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
    assert_equal 1, results.count
    assert_includes @response.body, locations(:swamp).name
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
