require 'test_helper'

class ProjectsControllerTest < ActionDispatch::IntegrationTest
  setup do
    @project = projects(:one)
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
end
