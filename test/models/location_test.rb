require "test_helper"
require "minitest/mock"
require "helpers/location_test_helper"

class LocationTest < ActiveSupport::TestCase
  test "can make a location API request" do
    # query = "search.php?addressdetails=1&normalizecity=1&q=UCSF"
    ENV["LOCATION_IQ_API_KEY"] = "abc"

    mock = MiniTest::Mock.new
    net_response = Net::HTTPSuccess.new(1.0, 200, "OK")
    mock.expect(:call, net_response, ["us1.locationiq.com", 443, { use_ssl: true }])
    request_mock = MiniTest::Mock.new
    request_mock.expect(:call, "hi")

    Net::HTTP.stub :start, mock do
      Net::HTTPResponse.stub :body, request_mock do
        puts "HI"
        # res = Location.location_api_request(query)
        puts "hihi"
      end
    end
    mock.verify
  end

  test "performs the right geosearch query" do
    api_response = [true, LocationTestHelper::API_GEOSEARCH_RESPONSE]
    query = ["search.php?addressdetails=1&normalizecity=1&q=UCSF"]
    mock = MiniTest::Mock.new
    mock.expect(:call, api_response, query)
    Location.stub :location_api_request, mock do
      res = Location.geosearch("UCSF")
      assert_equal res, api_response
    end
    mock.verify
  end
end
