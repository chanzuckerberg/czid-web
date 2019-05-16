require 'test_helper'

class PipelineRunTest < ActiveSupport::TestCase
  test "status url is correct" do
    assert_equal "https://idseq.net/samples/298486374/pipeline_runs", pipeline_runs(:four).status_url
  end

  test "run time is correct" do
    assert pipeline_runs(:four).run_time > 0.0
  end

  test "duration is correct" do
    assert pipeline_runs(:four).duration_hrs >= 0.0
  end
end
