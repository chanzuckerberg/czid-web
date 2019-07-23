require 'test_helper'

class HeatmapHelperTest < ActiveSupport::TestCase
  test "test data filter works" do
    assert_equal MetricUtil.send(:a_test?), true
  end
end
