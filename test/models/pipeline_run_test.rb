require 'test_helper'

class PipelineRunTest < ActiveSupport::TestCase
  test "run time is correct" do
    assert pipeline_runs(:four).run_time > 0.0
  end

  test "duration is correct" do
    assert pipeline_runs(:four).duration_hrs >= 0.0
  end

  test "Reads per million is correct" do
    pr = pipeline_runs(:six)

    assert_equal 1122, pr.total_reads
    assert_equal 500, pr.total_ercc_reads
    assert_equal 1, pr.subsample_fraction

    assert_equal 8038.585209003215, pr.rpm(5)
    assert_equal 0.0, pr.rpm(0)
  end
end
