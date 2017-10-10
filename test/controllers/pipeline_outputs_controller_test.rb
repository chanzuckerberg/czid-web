require 'test_helper'

class PipelineOutputsControllerTest < ActionDispatch::IntegrationTest
  setup do
    @pipeline_output = pipeline_outputs(:one)
    @pipeline_run = pipeline_runs(:three)
  end

  test 'should get index' do
    get pipeline_outputs_url
    assert_response :success
  end

  test 'should show pipeline_output' do
    get pipeline_output_url(@pipeline_output)
    assert_response :success
  end
end
