require 'test_helper'

class PipelineOutputsControllerTest < ActionDispatch::IntegrationTest
  setup do
    @pipeline_output = pipeline_outputs(:one)
    @pipeline_run = pipeline_runs(:three)
    @user = users(:one)
    @user_params = { 'user[email]' => @user.email, 'user[password]' => 'password' }
  end

  test 'should get index' do
    post user_session_path, params: @user_params
    get pipeline_outputs_url
    assert_response :success
  end

  test 'should show pipeline_output' do
    post user_session_path, params: @user_params
    get pipeline_output_url(@pipeline_output)
    assert_response :success
  end
end
