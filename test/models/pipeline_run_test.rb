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
    skip
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

  test "Reads per million is correct" do
    pr = pipeline_runs(:six)

    assert_equal 1122, pr.total_reads
    assert_equal nil, pr.total_ercc_reads
    assert_equal 1, pr.subsample_fraction

    assert_equal 4456.327985739751, pr.rpm(5)
    assert_equal 0.0, pr.rpm(0)
  end
end
