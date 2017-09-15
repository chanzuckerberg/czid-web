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

  test 'should get new' do
    get new_pipeline_output_url
    assert_response :success
  end

  test 'should create pipeline_output' do
    assert_difference('PipelineOutput.count') do
      post pipeline_outputs_url, params: { pipeline_output: { remaining_reads: @pipeline_output.remaining_reads, sample_id: @pipeline_output.sample_id, total_reads: @pipeline_output.total_reads }, job_id: @pipeline_run.job_id }
    end

    assert_redirected_to pipeline_output_url(PipelineOutput.last)
  end

  test 'should show pipeline_output' do
    get pipeline_output_url(@pipeline_output)
    assert_response :success
  end

  test 'should get edit' do
    get edit_pipeline_output_url(@pipeline_output)
    assert_response :success
  end

  test 'should update pipeline_output' do
    patch pipeline_output_url(@pipeline_output), params: { pipeline_output: { remaining_reads: @pipeline_output.remaining_reads, sample_id: @pipeline_output.sample_id, total_reads: @pipeline_output.total_reads } }
    assert_redirected_to pipeline_output_url(@pipeline_output)
  end

  test 'should destroy pipeline_output' do
    assert_difference('PipelineOutput.count', -1) do
      delete pipeline_output_url(@pipeline_output)
    end

    assert_redirected_to pipeline_outputs_url
  end
end
