require 'test_helper'

class ProjectsControllerTest < ActionDispatch::IntegrationTest
  setup do
    @project = projects(:one)
    @metadata_validation_project = projects(:metadata_validation_project)
    @deletable_project = projects(:deletable_project)
    @user = users(:one)
    @user_params = { 'user[email]' => @user.email, 'user[password]' => 'password' }
  end

  test 'should get index' do
    post user_session_path, params: @user_params
    get projects_url
    assert_response :success
  end

  test 'should get new' do
    post user_session_path, params: @user_params
    get new_project_url
    assert_response :success
  end

  test 'should create project' do
    post user_session_path, params: @user_params
    assert_difference('Project.count') do
      post projects_url, params: { project: { name: 'New Project' } }
    end

    assert_redirected_to project_url(Project.last)
  end

  test 'should show project' do
    post user_session_path, params: @user_params
    get project_url(@project)
    assert_response :success
  end

  test 'should get edit' do
    post user_session_path, params: @user_params
    get edit_project_url(@project)
    assert_response :success
  end

  test 'should update project' do
    post user_session_path, params: @user_params
    patch project_url(@project), params: { project: { name: @project.name } }
    assert_redirected_to project_url(@project)
  end

  test 'should destroy project' do
    post user_session_path, params: @user_params
    assert_difference('Project.count', -1) do
      delete project_url(@deletable_project)
    end

    assert_redirected_to projects_url
  end

  test 'validate_sample_names basic' do
    post user_session_path, params: @user_params

    post validate_sample_names_project_url(@metadata_validation_project), params: {
      sample_names: ['Test One', 'Test Two', 'metadata_validation_sample_mosquito']
    }, as: :json

    assert_response :success

    assert_equal ['Test One', 'Test Two', 'metadata_validation_sample_mosquito_1'], @response.parsed_body
  end

  test 'validate_sample_names weird edge case' do
    post user_session_path, params: @user_params

    post validate_sample_names_project_url(@metadata_validation_project), params: {
      sample_names: ['Test One', 'Test One', 'Test One_1']
    }, as: :json

    assert_response :success

    assert_equal ['Test One', 'Test One_1', 'Test One_1_1'], @response.parsed_body
  end
end
