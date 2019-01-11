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

  # Tests for validate_metadata_csv
  test 'metadata validate basic' do
    post user_session_path, params: @user_params

    post validate_metadata_csv_project_url(@metadata_validation_project), params: {
      metadata: {
        headers: ['sample_name', 'sample_type'],
        rows: [
          ['metadata_validation_sample_human', 'Whole Blood'],
          ['metadata_validation_sample_mosquito', 'Whole Blood']
        ]
      }
    }, as: :json

    assert_response :success
    assert_equal 0, @response.parsed_body['issues']['errors'].length
    assert_equal 0, @response.parsed_body['issues']['warnings'].length
  end

  test 'metadata validate sample name exists' do
    post user_session_path, params: @user_params

    post validate_metadata_csv_project_url(@metadata_validation_project), params: {
      metadata: {
        headers: ['sample_type'],
        rows: [
          ['Whole Blood'],
          ['Whole Blood']
        ]
      }
    }, as: :json

    assert_response :success

    # Error should throw if sample_name column is missing.
    assert_equal 1, @response.parsed_body['issues']['errors'].length
    assert_match 'sample_name column is required', @response.parsed_body['issues']['errors'][0]

    assert_equal 0, @response.parsed_body['issues']['warnings'].length
  end

  test 'metadata validate host genome name exists if new samples' do
    post user_session_path, params: @user_params

    post validate_metadata_csv_project_url(@metadata_validation_project), params: {
      metadata: {
        headers: ['sample_type'],
        rows: [
          ['Whole Blood'],
          ['Whole Blood']
        ]
      },
      new_samples: '1'
    }, as: :json

    assert_response :success

    # Error should throw if host_genome_name column is missing.
    assert_equal 1, @response.parsed_body['issues']['errors'].length
    assert_match 'host_genome_name column is required', @response.parsed_body['issues']['errors'][0]

    assert_equal 0, @response.parsed_body['issues']['warnings'].length
  end

  test 'metadata validate column names valid' do
    post user_session_path, params: @user_params

    post validate_metadata_csv_project_url(@metadata_validation_project), params: {
      metadata: {
        headers: ['sample_name', 'sample_type', 'foobar'],
        rows: [
          ['metadata_validation_sample_human', 'Whole Blood', 'foobar']
        ]
      }
    }, as: :json

    assert_response :success

    # Error should throw if column name is invalid.
    assert_equal 1, @response.parsed_body['issues']['errors'].length
    assert_match 'foobar', @response.parsed_body['issues']['errors'][0]

    assert_equal 0, @response.parsed_body['issues']['warnings'].length
  end

  test 'metadata validate row length valid' do
    post user_session_path, params: @user_params

    post validate_metadata_csv_project_url(@metadata_validation_project), params: {
      metadata: {
        headers: ['sample_name', 'sample_type'],
        rows: [
          ['metadata_validation_sample_human', 'Whole Blood', 'foobar'],
          ['metadata_validation_sample_mosquito']
        ]
      }
    }, as: :json

    assert_response :success

    # Error should throw if row has wrong number of values.
    assert_equal 2, @response.parsed_body['issues']['errors'].length
    assert_match 'Row 0 has too many values. (3 instead of 2)', @response.parsed_body['issues']['errors'][0]
    assert_match 'Row 1 has too few values. (1 instead of 2)', @response.parsed_body['issues']['errors'][1]

    assert_equal 0, @response.parsed_body['issues']['warnings'].length
  end

  test 'metadata validate sample names valid' do
    post user_session_path, params: @user_params

    post validate_metadata_csv_project_url(@metadata_validation_project), params: {
      metadata: {
        headers: ['sample_name', 'sample_type'],
        rows: [
          ['', 'Whole Blood'],
          ['foobar', 'Whole Blood'],
          ['metadata_validation_sample_human', 'Whole Blood']
        ]
      }
    }, as: :json

    assert_response :success

    assert_equal 2, @response.parsed_body['issues']['errors'].length
    # Error should throw if row is missing sample name.
    assert_match 'Row 0 is missing sample_name.', @response.parsed_body['issues']['errors'][0]
    # Error should throw if row sample name doesn't exist in this project.
    assert_match 'foobar (row 1) does not match any sample names in this project.', @response.parsed_body['issues']['errors'][1]

    assert_equal 0, @response.parsed_body['issues']['warnings'].length
  end

  test 'metadata validate host genome names valid if new samples' do
    post user_session_path, params: @user_params

    post validate_metadata_csv_project_url(@metadata_validation_project), params: {
      metadata: {
        headers: ['host_genome_name', 'sample_type'],
        rows: [
          ['', 'Whole Blood'],
          ['foobar', 'Whole Blood'],
          ['Human', 'Whole Blood']
        ]
      },
      new_samples: '1'
    }, as: :json

    assert_response :success

    assert_equal 2, @response.parsed_body['issues']['errors'].length
    # Error should throw if row is missing host genome name.
    assert_match 'Row 0 is missing host_genome_name.', @response.parsed_body['issues']['errors'][0]
    # Error should throw if host genome name is invalid.
    assert_match 'foobar (row 1) is an invalid host_genome_name.', @response.parsed_body['issues']['errors'][1]

    assert_equal 0, @response.parsed_body['issues']['warnings'].length
  end

  test 'metadata validate values valid' do
    post user_session_path, params: @user_params

    post validate_metadata_csv_project_url(@metadata_validation_project), params: {
      metadata: {
        headers: ['sample_name', 'sample_type', 'age', 'admission_date', 'blood_fed', 'reported_sex'],
        rows: [
          ['metadata_validation_sample_human', 'Whole Blood', 100, '2018-01-01', '', ''],
          ['metadata_validation_sample_human', 'Whole Blood', 'foobar', 'foobar', 'foobar', 'foobar'],
          ['metadata_validation_sample_mosquito', 'Whole Blood', '', '', 'Yes', 'Male'],
          ['metadata_validation_sample_mosquito', 'Whole Blood', 'foobar', 'foobar', 'foobar', 'foobar']
        ]
      }
    }, as: :json

    assert_response :success

    assert_equal 7, @response.parsed_body['issues']['errors'].length
    # Error should throw if invalid float is passed for float data type.
    assert_match 'foobar is not a valid number (row 1)', @response.parsed_body['issues']['errors'][0]
    # Error should throw if invalid date is passed for date data type.
    assert_match 'foobar is not a valid date (row 1)', @response.parsed_body['issues']['errors'][1]
    # Error should throw if metadata type is not supported for the sample's host genome.
    assert_match 'blood_fed is not a supported metadatum for host genome Human (row 1)', @response.parsed_body['issues']['errors'][2]
    assert_match 'reported_sex is not a supported metadatum for host genome Human (row 1)', @response.parsed_body['issues']['errors'][3]
    assert_match 'age is not a supported metadatum for host genome Mosquito (row 3)', @response.parsed_body['issues']['errors'][4]
    assert_match 'admission_date is not a supported metadatum for host genome Mosquito (row 3)', @response.parsed_body['issues']['errors'][5]
    # Error should throw if string value doesn't match fixed list of string options.
    assert_match 'foobar did not match options Male, Female (row 3)', @response.parsed_body['issues']['errors'][6]

    assert_equal 0, @response.parsed_body['issues']['warnings'].length
  end

  test 'metadata validate values valid if new sample' do
    post user_session_path, params: @user_params

    post validate_metadata_csv_project_url(@metadata_validation_project), params: {
      metadata: {
        headers: ['host_genome_name', 'sample_type', 'age', 'admission_date', 'blood_fed', 'reported_sex'],
        rows: [
          ['Human', 'Whole Blood', 100, '2018-01-01', '', ''],
          ['Human', 'Whole Blood', 'foobar', 'foobar', 'foobar', 'foobar'],
          ['Mosquito', 'Whole Blood', '', '', 'Yes', 'Male'],
          ['Mosquito', 'Whole Blood', 'foobar', 'foobar', 'foobar', 'foobar']
        ]
      },
      new_samples: '1'
    }, as: :json

    assert_response :success

    assert_equal 7, @response.parsed_body['issues']['errors'].length
    # Error should throw if invalid float is passed for float data type.
    assert_match 'foobar is not a valid number (row 1)', @response.parsed_body['issues']['errors'][0]
    # Error should throw if invalid date is passed for date data type.
    assert_match 'foobar is not a valid date (row 1)', @response.parsed_body['issues']['errors'][1]
    # Error should throw if metadata type is not supported for the sample's host genome.
    assert_match 'blood_fed is not a supported metadatum for host genome Human (row 1)', @response.parsed_body['issues']['errors'][2]
    assert_match 'reported_sex is not a supported metadatum for host genome Human (row 1)', @response.parsed_body['issues']['errors'][3]
    assert_match 'age is not a supported metadatum for host genome Mosquito (row 3)', @response.parsed_body['issues']['errors'][4]
    assert_match 'admission_date is not a supported metadatum for host genome Mosquito (row 3)', @response.parsed_body['issues']['errors'][5]
    # Error should throw if string value doesn't match fixed list of string options.
    assert_match 'foobar did not match options Male, Female (row 3)', @response.parsed_body['issues']['errors'][6]

    assert_equal 0, @response.parsed_body['issues']['warnings'].length
  end

  test 'metadata validate overwrite warning' do
    post user_session_path, params: @user_params

    post validate_metadata_csv_project_url(@metadata_validation_project), params: {
      metadata: {
        headers: ['sample_name', 'gender'],
        rows: [
          ['metadata_validation_sample_human', 'Female'],
          ['metadata_validation_sample_human', 'Male']
        ]
      }
    }, as: :json

    assert_response :success

    assert_equal 0, @response.parsed_body['issues']['errors'].length

    # Warning should throw if user is overwriting existing metadata with different value.
    assert_equal 1, @response.parsed_body['issues']['warnings'].length
    assert_match 'Value already exists. Female will overwrite Male for \'gender\' of metadata_validation_sample_human', @response.parsed_body['issues']['warnings'][0]
  end

  test 'metadata upload basic' do
    post user_session_path, params: @user_params

    post upload_metadata_project_url(@metadata_validation_project), params: {
      metadata: [
        {
          'sample_name' => 'metadata_validation_sample_human',
          'gender' => 'Female',
          'age' => 100,
          'admission_date' => '2018-01-01'
        }
      ]
    }, as: :json

    assert_response :success

    assert_equal 0, @response.parsed_body['errors'].length
  end

  test 'metadata upload no sample name' do
    post user_session_path, params: @user_params

    post upload_metadata_project_url(@metadata_validation_project), params: {
      metadata: [
        {
          'gender' => 'Female',
          'age' => 100,
          'admission_date' => '2018-01-01'
        }
      ]
    }, as: :json

    assert_response :success

    assert_equal 1, @response.parsed_body['errors'].length
    assert_match 'Row 0 is missing sample name', @response.parsed_body['errors'][0]
  end

  test 'metadata upload invalid sample name' do
    post user_session_path, params: @user_params

    post upload_metadata_project_url(@metadata_validation_project), params: {
      metadata: [
        {
          'sample_name' => 'foobar',
          'gender' => 'Female',
          'age' => 100,
          'admission_date' => '2018-01-01'
        }
      ]
    }, as: :json

    assert_response :success

    assert_equal 1, @response.parsed_body['errors'].length
    assert_match 'Row 0 has invalid sample name', @response.parsed_body['errors'][0]
  end

  test 'metadata upload invalid values' do
    post user_session_path, params: @user_params

    post upload_metadata_project_url(@metadata_validation_project), params: {
      metadata: [
        {
          'sample_name' => 'metadata_validation_sample_human',
          'gender' => 'foobar',
          'age' => 'foobar',
          'admission_date' => 'foobar'
        }
      ]
    }, as: :json

    assert_response :success

    puts @response.parsed_body['errors']

    assert_equal 3, @response.parsed_body['errors'].length
    assert_match 'metadata_validation_sample_human: Could not save (gender, foobar)', @response.parsed_body['errors'][0]
    assert_match 'metadata_validation_sample_human: Could not save (age, foobar)', @response.parsed_body['errors'][1]
    assert_match 'metadata_validation_sample_human: Could not save (admission_date, foobar)', @response.parsed_body['errors'][2]
  end
end
