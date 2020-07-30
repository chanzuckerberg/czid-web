require "test_helper"
require "minitest/mock"
require "test_helpers/location_test_helper"

class LocationsControllerTest < ActionDispatch::IntegrationTest
  setup do
    @user = users(:admin) # Change to non-admin user once released
    @user_params = { "user[email]" => @user.email, "user[password]" => "password" }
    @non_admin_user_params = { "user[email]" => users(:joe).email, "user[password]" => "password" }
    @api_response = true, LocationTestHelper::API_GEOSEARCH_RESPONSE
    @api_rate_limit_response = false, LocationTestHelper::API_RATE_LIMIT_RESPONSE
    @our_results = LocationTestHelper::FORMATTED_GEOSEARCH_RESPONSE
  end

  test "user can geosearch and see an API key error" do
    sign_in @user
    ENV["LOCATION_IQ_API_KEY"] = nil
    get external_search_locations_path, params: { query: "UCSF" }
    assert_response :error
    assert_equal LocationsController::GEOSEARCH_ERR_MSG, JSON.parse(@response.body)["message"]
  end

  test "user can geosearch and see a service-side error" do
    sign_in @user

    Location.stub :geo_search_request_base, @api_rate_limit_response do
      get external_search_locations_path, params: { query: "UCSF" }
      assert_response :error
      assert_equal LocationsController::GEOSEARCH_ERR_MSG, JSON.parse(@response.body)["message"]
      assert_match LocationsController::GEOSEARCH_RATE_LIMIT_ERR, JSON.parse(@response.body)["errors"][0]
    end
  end

  test "user can see their map playground results" do
    # TODO: Use non-admin user once released
    sign_in @user
    get map_playground_locations_path, as: :json

    assert_response :success
    results = JSON.parse(@response.body)
    assert_equal 3, results.count
    assert_includes @response.body, locations(:swamp).name
  end

  test "user can see a map playground error" do
    sign_in @user
    MetadataField.stub :find_by, nil do
      get map_playground_locations_path, as: :json
      assert_response :error
      assert_equal LocationsController::LOCATION_LOAD_ERR_MSG, JSON.parse(@response.body)["message"]
    end
  end

  # TODO: Add a test like this for non-admin users once released
  test "user can load location data for the map for a set of samples" do
    sign_in @user
    get sample_locations_locations_path, as: :json
    assert_response :success

    results = JSON.parse(@response.body)
    loc = locations(:swamp)
    actual_object = results[loc.id.to_s]
    expected_object = { "id" => loc.id, "name" => loc.name, "geo_level" => loc.geo_level, "country_name" => loc.country_name, "state_name" => loc.state_name, "subdivision_name" => loc.subdivision_name, "city_name" => loc.city_name, "lat" => loc.lat.to_s, "lng" => loc.lng.to_s, "country_id" => nil, "state_id" => nil, "subdivision_id" => nil, "city_id" => nil, "sample_ids" => [samples(:joe_project_sample_mosquito).id], "project_ids" => [projects(:joe_project).id] }

    assert_equal actual_object, expected_object
  end

  test "user can load location data including Country and State parent levels" do
    sign_in @user
    get sample_locations_locations_path, as: :json
    assert_response :success

    results = JSON.parse(@response.body)
    loc = locations(:kurigram)
    assert_includes results.keys, loc.id.to_s
    assert_includes results.keys, loc.country_id.to_s
    assert_includes results.keys, loc.state_id.to_s
  end

  # TODO: Uncomment and use non-admin user once released
  # test "joe cannot see someone else's private map playground results" do
  #   sign_in @user
  #   get map_playground_locations_path, as: :json
  #
  #   assert_response :success
  #   results = JSON.parse(@response.body).map { |r| r["location"] }
  #   assert_not results.include?(metadata(:sample_collection_location).string_validated_value)
  # end
end
