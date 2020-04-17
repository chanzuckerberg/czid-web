require "test_helper"
require "minitest/mock"

class MetadatumTest < ActiveSupport::TestCase
  include ErrorHelper

  test "should check and set Location Metadatum types" do
    mock_create = MiniTest::Mock.new
    loc = metadata(:sample_collection_location_v2)
    fields = JSON.parse(loc.raw_value, symbolize_names: true)
    mock_create.expect(:call, locations(:ucsf), [fields])

    Location.stub :find_or_new_by_fields, mock_create do
      res = loc.check_and_set_location_type
      assert_equal locations(:ucsf).id, res
    end
    mock_create.verify
  end

  test "should raise Location validation/setting errors" do
    loc = metadata(:sample_collection_location_v2)
    loc.raw_value = "{\"locationiq_id\":\"123\"}"
    loc.check_and_set_location_type
    assert_match MetadataValidationErrors::INVALID_LOCATION, loc.errors.full_messages[0]
  end
end
