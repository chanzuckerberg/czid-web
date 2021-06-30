require 'test_helper'

class ProjectsControllerTest < ActionDispatch::IntegrationTest
  setup do
    @project = projects(:one)
    @metadata_validation_project = projects(:metadata_validation_project)
    @joe_project = projects(:joe_project)
    @public_project = projects(:public_project)
    @deletable_project = projects(:deletable_project)
    @user = users(:admin_one)
    @user_nonadmin = users(:joe)
  end

  test 'should get index' do
    sign_in @user
    get projects_url
    assert_response :success
  end

  test 'should get new' do
    sign_in @user
    get new_project_url
    assert_response :success
  end

  test 'should create project' do
    sign_in @user
    assert_difference('Project.count') do
      post projects_url, params: { project: { name: 'New Project', public_access: 0, description: "New Project" } }
    end

    assert_redirected_to project_url(Project.last)
  end

  test 'should show project' do
    sign_in @user
    get project_url(@project)
    assert_response :success
  end

  test 'should get edit' do
    sign_in @user
    get edit_project_url(@project)
    assert_response :success
  end

  test 'should update project' do
    sign_in @user
    patch project_url(@project), params: { project: { name: @project.name, public_access: 1, description: @project.description } }
    assert_redirected_to project_url(@project)
  end

  test 'should destroy project' do
    sign_in @user
    assert_difference('Project.count', -1) do
      delete project_url(@deletable_project)
    end

    assert_redirected_to projects_url
  end

  test 'joe can query the metadata fields that belong to a public project' do
    sign_in @user_nonadmin

    get metadata_fields_projects_url, params: {
      projectIds: [@public_project.id],
    }
    assert_response :success

    assert_equal ["Nucleotide Type", "Sample Type"], @response.parsed_body.pluck("name")
  end

  test 'joe can query the metadata fields that belong to a private project he is a part of' do
    sign_in @user_nonadmin

    get metadata_fields_projects_url, params: {
      projectIds: [@joe_project.id],
    }
    assert_response :success

    assert_equal ["Nucleotide Type", "Age", "Reported Sex", "Sex", "Sample Type", "Admission Date", "Blood Fed"], @response.parsed_body.pluck("name")
  end

  test 'joe cannot query the metadata fields that belong to another private project' do
    sign_in @user_nonadmin

    assert_raises(ActiveRecord::RecordNotFound) do
      get metadata_fields_projects_url, params: {
        projectIds: [@metadata_validation_project.id],
      }
    end
  end

  # If multiple samples, merge the fields.
  test 'joe can query the metadata fields that belong to multiple projects' do
    sign_in @user_nonadmin

    get metadata_fields_projects_url, params: {
      projectIds: [@public_project.id, @joe_project.id],
    }
    assert_response :success

    assert_equal ["Nucleotide Type", "Age", "Reported Sex", "Sex", "Sample Type", "Admission Date", "Blood Fed"], @response.parsed_body.pluck("name")
  end

  # If multiple samples but one is invalid, return fields for the valid ones.
  test 'joe can query the metadata fields that belong to multiple projects, and invalid projects will be omitted.' do
    sign_in @user_nonadmin

    get metadata_fields_projects_url, params: {
      projectIds: [@public_project.id, @metadata_validation_project.id],
    }
    assert_response :success

    assert_equal ["Nucleotide Type", "Sample Type"], @response.parsed_body.pluck("name")
  end
end
