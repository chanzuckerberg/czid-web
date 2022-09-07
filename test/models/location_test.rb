require "test_helper"
require "minitest/mock"
require "test_helpers/location_test_helper"

class LocationTest < ActiveSupport::TestCase
  test "should raise an API key error" do
    ENV["LOCATION_IQ_API_KEY"] = nil
    err = assert_raises RuntimeError do
      Location.location_api_request("")
    end
    assert_equal "No location API key", err.message
  end

  test "should perform the right geosearch query" do
    api_response = [true, LocationTestHelper::API_GEOSEARCH_RESPONSE]
    query = "search.php?addressdetails=1&normalizecity=1&q=UCSF"
    mock = MiniTest::Mock.new
    mock.expect(:call, api_response, [query])
    Location.stub :location_api_request, mock do
      res = Location.geosearch("UCSF")
      assert_equal api_response, res
    end
    assert mock.verify
  end

  test "should use result limits in geosearch requests" do
    limit = 7
    query = "search.php?addressdetails=1&normalizecity=1&q=UCSF&limit=#{limit}"
    mock = MiniTest::Mock.new
    mock.expect(:call, nil, [query])
    Location.stub :location_api_request, mock do
      Location.geosearch("UCSF", limit)
    end
    assert mock.verify
  end

  test "should raise an error for empty geosearch" do
    err = assert_raises ArgumentError do
      Location.geosearch("")
    end
    assert_equal "No query for geosearch", err.message
  end

  test "should create Location entry from parameters" do
    location_params = LocationTestHelper::FORMATTED_GEOSEARCH_RESPONSE[0]
    params_with_junk = location_params.deep_dup
    params_with_junk[:junk] = "junkvalue"
    new_location = Location.new

    mock_new = MiniTest::Mock.new
    mock_new.expect(:call, new_location, [location_params])
    Location.stub :new, mock_new do
      res = Location.new_from_params(params_with_junk)
      assert_equal new_location, res
    end
    assert mock_new.verify
  end

  test "should raise Location creation error" do
    err = assert_raises RuntimeError do
      Location.new_from_params("")
    end
    assert_match "Couldn't make new Location", err.message
  end

  test "should geosearch by OSM ID and type" do
    api_response = LocationTestHelper::API_OSM_ID_SEARCH_RESPONSE
    osm_id = api_response["osm_id"]
    osm_type = api_response["osm_type"]
    query = "reverse.php?osm_id=#{osm_id}&osm_type=#{osm_type[0].capitalize}"
    mock = MiniTest::Mock.new
    mock.expect(:call, [true, api_response], [query])
    Location.stub :location_api_request, mock do
      res = Location.geosearch_by_osm_id(osm_id, osm_type)
      assert_equal [true, api_response], res
    end
    assert mock.verify
  end

  test "should create new Location by OSM ID" do
    api_response = LocationTestHelper::API_OSM_ID_SEARCH_RESPONSE
    osm_id = api_response["osm_id"]
    osm_type = api_response["osm_type"]

    new_location = Location.new
    mock_geosearch = MiniTest::Mock.new
    mock_geosearch.expect(:call, [true, api_response], [osm_id, osm_type])
    Location.stub :find_by, nil do
      Location.stub :geosearch_by_osm_id, mock_geosearch do
        Location.stub :new_from_params, new_location do
          res = Location.find_or_new_by_fields(locationiq_id: "123", osm_id: osm_id, osm_type: osm_type)
          assert_equal new_location, res
        end
      end
    end
  end

  test "should geosearch by country and state name" do
    api_response = [true, LocationTestHelper::API_GEOSEARCH_CALIFORNIA_RESPONSE]
    query = "search.php?addressdetails=1&normalizecity=1&country=USA&state=California"
    mock = MiniTest::Mock.new
    mock.expect(:call, api_response, [query])
    Location.stub :location_api_request, mock do
      res = Location.geosearch_by_levels("USA", "California")
      assert_equal api_response, res
    end
    assert mock.verify
  end

  test "should fetch a missing Country parent level for a location" do
    original = locations(:ucsf)
    api_response = [true, LocationTestHelper::API_GEOSEARCH_USA_RESPONSE]
    mock_geosearch = MiniTest::Mock.new
    mock_geosearch.expect(:call, api_response, [original.country_name])
    mock_new_from_params = MiniTest::Mock.new
    mock_new_from_params.expect(:call, locations(:bangladesh), [Hash])

    Location.stub :geosearch_by_levels, mock_geosearch do
      Location.stub :new_from_params, mock_new_from_params do
        result = Location.check_and_fetch_parents(original)
        assert_equal locations(:bangladesh).id, result.country_id
        assert_equal locations(:california).id, result.state_id
        assert_nil result.subdivision_id
        assert_equal original.id, result.city_id
      end
    end

    assert mock_geosearch.verify
    assert mock_new_from_params.verify
  end

  test "should fetch missing Country and State parent levels for a location" do
    original = locations(:columbus)
    api_response_usa = [true, LocationTestHelper::API_GEOSEARCH_USA_RESPONSE]
    api_response_ca = [true, LocationTestHelper::API_GEOSEARCH_CALIFORNIA_RESPONSE]
    mock_geosearch = MiniTest::Mock.new
    mock_geosearch.expect(:call, api_response_usa, [original.country_name])
    mock_geosearch.expect(:call, api_response_ca, [original.country_name, original.state_name])
    mock_new_from_params = MiniTest::Mock.new
    mock_new_from_params.expect(:call, locations(:bangladesh), [Hash])
    mock_new_from_params.expect(:call, locations(:california), [Hash])

    Location.stub :geosearch_by_levels, mock_geosearch do
      Location.stub :new_from_params, mock_new_from_params do
        result = Location.check_and_fetch_parents(original)
        assert_equal locations(:bangladesh).id, result.country_id
        assert_equal locations(:california).id, result.state_id
        assert_nil result.subdivision_id
        assert_equal original.id, result.city_id
      end
    end

    assert mock_geosearch.verify
    assert mock_new_from_params.verify
  end

  test "should check parent levels and not geosearch unnecessarily" do
    original = locations(:rangpur)
    mock_geosearch = -> { raise "should not call geosearch" }

    Location.stub :geosearch_by_levels, mock_geosearch do
      result = Location.check_and_fetch_parents(original)
      assert_equal locations(:bangladesh).id, result.country_id
      assert_equal locations(:rangpur).id, result.state_id
      assert_nil result.subdivision_id
      assert_nil result.city_id
    end
  end

  test "should identify present and missing geographical parent levels" do
    original = locations(:ucsf)
    present_parent_level_ids, missing_parent_levels = Location.present_and_missing_parents(original)
    assert_equal ["state"], present_parent_level_ids.keys
    assert_equal ["country"], missing_parent_levels

    original = locations(:bangladesh)
    present_parent_level_ids, missing_parent_levels = Location.present_and_missing_parents(original)
    assert_equal ["country"], present_parent_level_ids.keys
    assert_equal [], missing_parent_levels

    original = locations(:columbus)
    present_parent_level_ids, missing_parent_levels = Location.present_and_missing_parents(original)
    assert_equal [], present_parent_level_ids.keys
    assert_equal %w[country state], missing_parent_levels
  end

  test "should fill in parent ids on a Location" do
    original = locations(:swamp)
    parent_level_ids = { "country" => 10, "state" => 20, "subdivision" => 30, "city" => 40 }
    result = Location.set_parent_ids(original, parent_level_ids)
    assert_equal 10, result.country_id
    assert_equal 20, result.state_id
    assert_equal 30, result.subdivision_id
    assert_equal 40, result.city_id
  end

  test "should not fill in a geo level id below a Location's actual level" do
    original = locations(:california)
    parent_level_ids = { "country" => 10, "state" => 20, "subdivision" => 30, "city" => 40 }
    result = Location.set_parent_ids(original, parent_level_ids)
    assert_equal 10, result.country_id
    assert_equal 20, result.state_id
    assert_nil result.subdivision_id
    assert_nil result.city_id
  end
end
