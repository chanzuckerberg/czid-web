require 'test_helper'

class ReportsControllerTest < ActionDispatch::IntegrationTest
  setup do
    @report = reports(:one)
    @user = users(:one)
    @user_params = { 'user[email]' => @user.email, 'user[password]' => 'password' }
  end

  test "should get index" do
    get reports_url
    assert_response :success
  end

  test "should get new" do
    post user_session_path, params: @user_params
    get new_report_url
    assert_response :success
  end

  test "should create report" do
    post user_session_path, params: @user_params
    assert_difference('Report.count') do
      post reports_url, params: { report: { name: @report.name, pipeline_output_id: @report.pipeline_output_id, background_id: @report.background_id } }
    end

    assert_redirected_to report_url(Report.last)
  end

  test "should show report" do
    get report_url(@report)
    assert_response :success
  end

  test "should get edit" do
    post user_session_path, params: @user_params
    get edit_report_url(@report)
    assert_response :success
  end

  test "should update report" do
    post user_session_path, params: @user_params
    patch report_url(@report), params: { report: { name: @report.name, pipeline_output_id: @report.pipeline_output_id } }
    assert_redirected_to report_url(@report)
  end

  test "should destroy report" do
    post user_session_path, params: @user_params
    assert_difference('Report.count', -1) do
      delete report_url(@report)
    end

    assert_redirected_to reports_url
  end
end
