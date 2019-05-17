require "test_helper"
require "minitest/mock"
require "helpers/location_test_helper"

class LocationTest < ActiveSupport::TestCase
  test "makes a location API request" do
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

  test "raises an API key error" do
    ENV["LOCATION_IQ_API_KEY"] = nil
    err = assert_raises RuntimeError do
      Location.location_api_request("")
    end
    assert_equal "No location API key", err.message
  end

  test "performs the right geosearch query" do
    api_response = [true, LocationTestHelper::API_GEOSEARCH_RESPONSE]
    query = ["search.php?addressdetails=1&normalizecity=1&q=UCSF"]
    mock = MiniTest::Mock.new
    mock.expect(:call, api_response, query)
    Location.stub :location_api_request, mock do
      res = Location.geosearch("UCSF")
      assert_equal api_response, res
    end
    assert mock.verify
  end

  test "raises an error for empty geosearch" do
    err = assert_raises ArgumentError do
      Location.geosearch("")
    end
    assert_equal "No query for geosearch", err.message
  end

  test "creates a Location entry from parameters" do
    location_params = LocationTestHelper::FORMATTED_GEOSEARCH_RESPONSE[0]
    new_location = Location.new
    mock_create = MiniTest::Mock.new
    # def mock_create.call(input)
    #   puts input
    # end

    # assert_equal location_params, {"name"=>"University of California, San Francisco, Parnassus Avenue, Inner Sunset, San Francisco, San Francisco City and County, California, 94131, USA", "geo_level"=>"city", "country_name"=>"USA", "state_name"=>"California", "subdivision_name"=>"San Francisco City and County", "city_name"=>"San Francisco", "lat"=>37.76, "lng"=>-122.45, "country_code"=>"us", "osm_id"=>34324395, "locationiq_id"=>89640023}

    mock_create.expect(:call, new_location, [location_params])
    Location.stub :create!, mock_create do
      res = Location.create_from_params(location_params)
      puts res
      puts "hi"
    end
    assert mock_create.verify
  end
end
