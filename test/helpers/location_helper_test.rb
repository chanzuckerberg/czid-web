# DEPRECATED: Add new tests to spec/helpers/location_helper_spec.rb

require "test_helper"
require "test_helpers/location_test_helper"

class LocationHelperTest < ActionView::TestCase
  include LocationTestHelper

  test "should adapt LocationIQ responses" do
    assert_equal LocationTestHelper::FORMATTED_GEOSEARCH_RESPONSE[0].symbolize_keys, LocationHelper.adapt_location_iq_response(LocationTestHelper::API_GEOSEARCH_RESPONSE[0])
  end
end
