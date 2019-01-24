require 'test_helper'
require 'constants/metadata'

# Tests ProjectsController validate_metadata_csv endpoint
class ProjectsMetadataValidateTest < ActionDispatch::IntegrationTest
  setup do
    @project = projects(:one)
    @metadata_validation_project = projects(:metadata_validation_project)
    @deletable_project = projects(:deletable_project)
    @user = users(:one)
    @user_params = { 'user[email]' => @user.email, 'user[password]' => 'password' }
  end

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
    puts @response.parsed_body['issues']
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
    assert_match MetadataValidationErrors.missing_sample_name_column, @response.parsed_body['issues']['errors'][0]

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
    assert_match MetadataValidationErrors.missing_host_genome_name_column, @response.parsed_body['issues']['errors'][0]

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
    assert_match MetadataValidationErrors.column_not_supported('foobar', 3), @response.parsed_body['issues']['errors'][0]

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
    assert_match MetadataValidationErrors.row_wrong_values(3, 2, 1), @response.parsed_body['issues']['errors'][0]
    assert_match MetadataValidationErrors.row_wrong_values(1, 2, 2), @response.parsed_body['issues']['errors'][1]

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
    assert_match MetadataValidationErrors.row_missing_sample_name(1), @response.parsed_body['issues']['errors'][0]
    # Error should throw if row sample name doesn't exist in this project.
    assert_match MetadataValidationErrors.row_invalid_sample_name('foobar', 2), @response.parsed_body['issues']['errors'][1]

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
    assert_match MetadataValidationErrors.row_missing_host_genome_name(1), @response.parsed_body['issues']['errors'][0]
    # Error should throw if host genome name is invalid.
    assert_match MetadataValidationErrors.row_invalid_host_genome_name('foobar', 2), @response.parsed_body['issues']['errors'][1]

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
    assert_match "#{MetadataValidationErrors.invalid_number('foobar')} (row 2)", @response.parsed_body['issues']['errors'][0]
    # Error should throw if invalid date is passed for date data type.
    assert_match "#{MetadataValidationErrors.invalid_date('foobar')} (row 2)", @response.parsed_body['issues']['errors'][1]
    # Error should throw if metadata type is not supported for the sample's host genome.
    assert_match "#{MetadataValidationErrors.invalid_key_for_host_genome('blood_fed', 'Human')} (row 2)", @response.parsed_body['issues']['errors'][2]
    assert_match "#{MetadataValidationErrors.invalid_key_for_host_genome('reported_sex', 'Human')} (row 2)", @response.parsed_body['issues']['errors'][3]
    assert_match "#{MetadataValidationErrors.invalid_key_for_host_genome('age', 'Mosquito')} (row 4)", @response.parsed_body['issues']['errors'][4]
    assert_match "#{MetadataValidationErrors.invalid_key_for_host_genome('admission_date', 'Mosquito')} (row 4)", @response.parsed_body['issues']['errors'][5]
    # Error should throw if string value doesn't match fixed list of string options.
    assert_match "#{MetadataValidationErrors.invalid_option('reported_sex', 'foobar')} (row 4)", @response.parsed_body['issues']['errors'][6]

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
    assert_match "#{MetadataValidationErrors.invalid_number('foobar')} (row 2)", @response.parsed_body['issues']['errors'][0]
    # Error should throw if invalid date is passed for date data type.
    assert_match "#{MetadataValidationErrors.invalid_date('foobar')} (row 2)", @response.parsed_body['issues']['errors'][1]
    # Error should throw if metadata type is not supported for the sample's host genome.
    assert_match "#{MetadataValidationErrors.invalid_key_for_host_genome('blood_fed', 'Human')} (row 2)", @response.parsed_body['issues']['errors'][2]
    assert_match "#{MetadataValidationErrors.invalid_key_for_host_genome('reported_sex', 'Human')} (row 2)", @response.parsed_body['issues']['errors'][3]
    assert_match "#{MetadataValidationErrors.invalid_key_for_host_genome('age', 'Mosquito')} (row 4)", @response.parsed_body['issues']['errors'][4]
    assert_match "#{MetadataValidationErrors.invalid_key_for_host_genome('admission_date', 'Mosquito')} (row 4)", @response.parsed_body['issues']['errors'][5]
    # Error should throw if string value doesn't match fixed list of string options.
    assert_match "#{MetadataValidationErrors.invalid_option('reported_sex', 'foobar')} (row 4)", @response.parsed_body['issues']['errors'][6]

    assert_equal 0, @response.parsed_body['issues']['warnings'].length
  end

  test 'metadata validate overwrite warning' do
    post user_session_path, params: @user_params

    post validate_metadata_csv_project_url(@metadata_validation_project), params: {
      metadata: {
        headers: ['sample_name', 'sex'],
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

    assert_match "#{MetadataValidationWarnings.value_already_exists('Female', 'Male', 'sex')} (row 1)", @response.parsed_body['issues']['warnings'][0]
  end
end
