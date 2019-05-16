require 'test_helper'
require "minitest/mock"
require "helpers/location_test_helper"

class LocationTest < ActiveSupport::TestCase
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
