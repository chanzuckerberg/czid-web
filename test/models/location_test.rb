require "test_helper"
require "minitest/mock"
require "test_helpers/location_test_helper"

class LocationTest < ActiveSupport::TestCase
  test "should make a location API request" do
    query = "search.php?addressdetails=1&normalizecity=1&q=UCSF"
    ENV["LOCATION_IQ_API_KEY"] = "abc"

    net_response = MiniTest::Mock.new
    net_response.expect(:body, LocationTestHelper::API_GEOSEARCH_RESPONSE.to_json)
    net_response.expect(:is_a?, true, [Object])

    net_start = MiniTest::Mock.new
    net_start.expect(:call, net_response, ["us1.locationiq.com", 443, { use_ssl: true }])

    Net::HTTP.stub :start, net_start do
      res = Location.location_api_request(query)
      assert_equal [true, LocationTestHelper::API_GEOSEARCH_RESPONSE], res
    end
    assert net_response.verify
    assert net_start.verify
  end

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

    mock_create = MiniTest::Mock.new
    mock_create.expect(:call, new_location, [location_params])
    Location.stub :create!, mock_create do
      res = Location.create_from_params(params_with_junk)
      assert_equal new_location, res
    end
    assert mock_create.verify
  end

  test "should raise Location creation error" do
    err = assert_raises RuntimeError do
      Location.create_from_params("")
    end
    assert_match "Couldn't save Location", err.message
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

  test "should find existing Location by API ID" do
    new_location = Location.new
    mock = MiniTest::Mock.new
    mock.expect(:call, new_location, [{ locationiq_id: "123" }])
    Location.stub :find_by, mock do
      res = Location.find_or_create_by_api_ids("123", nil, nil)
      assert_equal new_location, res
    end
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
        Location.stub :create_from_params, new_location do
          res = Location.find_or_create_by_api_ids("123", osm_id, osm_type)
          assert_equal new_location, res
        end
      end
    end
  end
end
