require 'test_helper'

# Tests ProjectsController validate_metadata_csv endpoint
class ProjectsMetadataValidateTest < ActionDispatch::IntegrationTest
  include ErrorHelper

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
    assert_equal 0, @response.parsed_body['issues']['errors'].length
    assert_equal 0, @response.parsed_body['issues']['warnings'].length
  end

  # Test that using the display name for metadata fields also works.
  test 'metadata validate with display name' do
    post user_session_path, params: @user_params

    post validate_metadata_csv_project_url(@metadata_validation_project), params: {
      metadata: {
        headers: ['sample_name', 'Sample Type'],
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
    assert_match MetadataValidationErrors::MISSING_SAMPLE_NAME_COLUMN, @response.parsed_body['issues']['errors'][0]

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
    assert_equal 1, @response.parsed_body['issues']['errors'].length
    assert @response.parsed_body['issues']['errors'][0]['isGroup']
    assert_equal ErrorAggregator::ERRORS[:row_wrong_num_values][:title].call(2, "num_cols" => 2), @response.parsed_body['issues']['errors'][0]['caption']
    assert_equal [[1, "metadata_validation_sample_human", 3], [2, "metadata_validation_sample_mosquito", 1]], @response.parsed_body['issues']['errors'][0]['rows']

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
    assert @response.parsed_body['issues']['errors'][0]['isGroup']
    assert_equal ErrorAggregator::ERRORS[:row_missing_sample_name][:title].call(1, nil), @response.parsed_body['issues']['errors'][0]['caption']
    assert_equal [[1]], @response.parsed_body['issues']['errors'][0]['rows']
    # Error should throw if row sample name doesn't exist in this project.
    assert @response.parsed_body['issues']['errors'][1]['isGroup']
    assert_equal ErrorAggregator::ERRORS[:no_matching_sample_existing][:title].call(1, nil), @response.parsed_body['issues']['errors'][1]['caption']
    assert_equal [[2, "foobar"]], @response.parsed_body['issues']['errors'][1]['rows']

    assert_equal 0, @response.parsed_body['issues']['warnings'].length
  end

  test 'metadata validate values valid' do
    post user_session_path, params: @user_params

    post validate_metadata_csv_project_url(@metadata_validation_project), params: {
      metadata: {
        headers: ['sample_name', 'sample_type', 'age', 'admission_date', 'blood_fed', 'reported_sex'],
        rows: [
          ['metadata_validation_sample_human', 'Whole Blood', 'foobar', 'foobar', 'foobar', 'foobar'],
          ['metadata_validation_sample_mosquito', 'Whole Blood', 'foobar', 'foobar', 'foobar', 'foobar']
        ]
      }
    }, as: :json

    assert_response :success

    assert_equal 3, @response.parsed_body['issues']['errors'].length
    #    assert_equal "", @response.parsed_body['issues']['errors'][0]['caption']
    # Error should throw if invalid float is passed for float data type.
    assert @response.parsed_body['issues']['errors'][0]['isGroup']
    assert @response.parsed_body['issues']['errors'][0]['caption'].starts_with?("1 invalid values for \"Age\" (column 3)")
    assert_equal [[1, "metadata_validation_sample_human", "foobar"]], @response.parsed_body['issues']['errors'][0]['rows']
    # Error should throw if invalid date is passed for date data type.
    assert @response.parsed_body['issues']['errors'][1]['isGroup']
    assert @response.parsed_body['issues']['errors'][1]['caption'].starts_with?("1 invalid values for \"Admission Date\" (column 4)")
    assert_equal [[1, "metadata_validation_sample_human", "foobar"]], @response.parsed_body['issues']['errors'][1]['rows']
    # Error should throw if string value doesn't match fixed list of string options.
    assert @response.parsed_body['issues']['errors'][2]['isGroup']
    assert @response.parsed_body['issues']['errors'][2]['caption'].starts_with?("1 invalid values for \"Reported Sex\" (column 6)")
    assert_equal [[2, "metadata_validation_sample_mosquito", "foobar"]], @response.parsed_body['issues']['errors'][2]['rows']

    assert_equal 0, @response.parsed_body['issues']['warnings'].length
  end

  test 'metadata validate overwrite warning' do
    post user_session_path, params: @user_params

    post validate_metadata_csv_project_url(@metadata_validation_project), params: {
      metadata: {
        headers: ['sample_name', 'sex', 'Nucleotide Type'],
        rows: [
          ['metadata_validation_sample_human_existing_metadata', 'Female', "DNA"]
        ]
      }
    }, as: :json

    assert_response :success

    assert_equal 0, @response.parsed_body['issues']['errors'].length

    # Warning should throw if user is overwriting existing metadata with different value.
    assert_equal 1, @response.parsed_body['issues']['warnings'].length

    assert @response.parsed_body['issues']['warnings'][0]['isGroup']
    assert_equal ErrorAggregator::ERRORS[:value_already_exists][:title].call(2, nil), @response.parsed_body['issues']['warnings'][0]['caption']
    assert_equal [
      [1, "metadata_validation_sample_human_existing_metadata", "sex", "Male", "Female"],
      [1, "metadata_validation_sample_human_existing_metadata", "Nucleotide Type", "RNA", "DNA"]
    ], @response.parsed_body['issues']['warnings'][0]['rows']
  end

  test 'metadata validate core and custom fields' do
    post user_session_path, params: @user_params

    post validate_metadata_csv_project_url(@metadata_validation_project), params: {
      metadata: {
        headers: ['sample_name', 'example_core_field', 'Custom Field 1', 'Custom Field 2'],
        rows: [
          ['metadata_validation_sample_human', 'Foobar', 'Foobar', 'Foobar']
        ]
      }
    }, as: :json

    assert_response :success

    assert_equal 0, @response.parsed_body['issues']['errors'].length
    assert_equal 1, @response.parsed_body['issues']['warnings'].length

    assert @response.parsed_body['issues']['warnings'][0]['isGroup']
    assert_equal ErrorAggregator::ERRORS[:custom_field_creation][:title].call(2, nil), @response.parsed_body['issues']['warnings'][0]['caption']
    assert_equal [
      [3, "Custom Field 1"],
      [4, "Custom Field 2"]
    ], @response.parsed_body['issues']['warnings'][0]['rows']
  end
end
