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

  test "precaching executes report_info_json" do
    mock = Minitest::Mock.new

    pr = pipeline_runs(:four)

    Background.where(ready: 1).pluck(:id).each do |background_id|
      # Verifies that the method is called with these params
      mock.expect(:call, nil, [pr, background_id])
    end

    ReportHelper.stub(:report_info_json, mock) do
      pr.precache_report_info!
    end

    mock.verify
  end
end
