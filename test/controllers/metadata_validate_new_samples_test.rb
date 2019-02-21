require 'test_helper'
require 'constants/errors'

# Tests MetadataController validate_csv_for_new_samples endpoint
class MetadataValudateNewSamplesTest < ActionDispatch::IntegrationTest
  setup do
    @user = users(:one)
    @mosquito_host_genome = host_genomes(:mosquito)
    @human_host_genome = host_genomes(:human)
    @user_params = { 'user[email]' => @user.email, 'user[password]' => 'password' }
  end

  test 'basic' do
    post user_session_path, params: @user_params

    post validate_csv_for_new_samples_metadata_url, params: {
      metadata: {
        headers: ['sample_name', 'host_genome', 'sample_type', 'blood_fed'],
        rows: [
          ['Test Sample', 'Mosquito', 'Whole Blood', 'Blood Fed'],
          ['Test Sample 2', 'Mosquito', 'Whole Blood', 'Partially Blood Fed']
        ]
      },
      samples: [
        {
          name: "Test Sample"
        },
        {
          name: "Test Sample 2"
        }
      ]
    }, as: :json

    assert_response :success

    assert_equal 0, @response.parsed_body['issues']['errors'].length
    assert_equal 0, @response.parsed_body['issues']['warnings'].length
  end

  test 'sample names valid' do
    post user_session_path, params: @user_params

    post validate_csv_for_new_samples_metadata_url, params: {
      metadata: {
        headers: ['sample_name', 'host_genome', 'sample_type', 'blood_fed'],
        rows: [
          ['Test Sample', 'Mosquito', 'Whole Blood', 'Blood Fed'],
          ['Test Sample 2', 'Mosquito', 'Whole Blood', 'Blood Fed']
        ]
      },
      samples: [
        {
          name: "Test Sample"
        }
      ]
    }, as: :json

    assert_response :success

    assert_equal 1, @response.parsed_body['issues']['errors'].length
    # Error should throw if row sample name doesn't match any samples.
    assert_match MetadataValidationErrors.row_invalid_sample_name('Test Sample 2', 2), @response.parsed_body['issues']['errors'][0]

    assert_equal 0, @response.parsed_body['issues']['warnings'].length
  end

  test 'missing metadata for sample' do
    post user_session_path, params: @user_params

    post validate_csv_for_new_samples_metadata_url, params: {
      metadata: {
        headers: ['sample_name', 'host_genome', 'sample_type', 'blood_fed'],
        rows: [
          ['Test Sample', 'Mosquito', 'Whole Blood', 'Blood Fed']
        ]
      },
      samples: [
        {
          name: "Test Sample"
        },
        {
          name: "Test Sample 2"
        }
      ]
    }, as: :json

    assert_response :success

    assert_equal 1, @response.parsed_body['issues']['errors'].length
    # Error should throw if a sample is missing from the metadata.
    assert_match MetadataValidationErrors.missing_sample_metadata_row('Test Sample 2'), @response.parsed_body['issues']['errors'][0]

    assert_equal 0, @response.parsed_body['issues']['warnings'].length
  end

  test 'missing host genome column' do
    post user_session_path, params: @user_params

    post validate_csv_for_new_samples_metadata_url, params: {
      metadata: {
        headers: ['sample_name', 'sample_type', 'nucleotide_type', 'blood_fed'],
        rows: [
          ['Test Sample', 'Whole Blood', '', 'Blood Fed'],
          ['Test Sample 2', 'Whole Blood', 'DNA', 'Blood Fed']
        ]
      },
      samples: [
        {
          name: "Test Sample"
        },
        {
          name: "Test Sample 2"
        }
      ]
    }, as: :json

    assert_response :success

    assert_equal 1, @response.parsed_body['issues']['errors'].length
    # Error should throw if metadata type is not supported for the sample's host genome.
    assert_match MetadataValidationErrors.missing_host_genome_column, @response.parsed_body['issues']['errors'][0]

    assert_equal 0, @response.parsed_body['issues']['warnings'].length
  end

  test 'missing or invalid host genome' do
    post user_session_path, params: @user_params

    post validate_csv_for_new_samples_metadata_url, params: {
      metadata: {
        headers: ['sample_name', 'host_genome', 'sample_type', 'nucleotide_type', 'blood_fed'],
        rows: [
          ['Test Sample', 'Fake Genome', 'Whole Blood', 'RNA', 'Blood Fed'],
          ['Test Sample 2', '', 'Whole Blood', 'DNA', 'Blood Fed']
        ]
      },
      samples: [
        {
          name: "Test Sample"
        },
        {
          name: "Test Sample 2"
        }
      ]
    }, as: :json

    assert_response :success

    assert_equal 2, @response.parsed_body['issues']['errors'].length
    # Error should throw if host genome is invalid for a row.
    assert_match MetadataValidationErrors.row_invalid_host_genome('Fake Genome', 1), @response.parsed_body['issues']['errors'][0]
    # Error should throw if host genome is missing for a row.
    assert_match MetadataValidationErrors.row_missing_host_genome(2), @response.parsed_body['issues']['errors'][1]

    assert_equal 0, @response.parsed_body['issues']['warnings'].length
  end

  test 'fields valid for host genome' do
    post user_session_path, params: @user_params

    post validate_csv_for_new_samples_metadata_url, params: {
      metadata: {
        headers: ['sample_name', 'host_genome', 'sample_type', 'nucleotide_type', 'blood_fed'],
        rows: [
          ['Test Sample', 'Mosquito', 'Whole Blood', '', 'Blood Fed'],
          ['Test Sample 2', 'Human', 'Whole Blood', 'DNA', 'Blood Fed']
        ]
      },
      samples: [
        {
          name: "Test Sample"
        },
        {
          name: "Test Sample 2"
        }
      ]
    }, as: :json

    assert_response :success

    assert_equal 1, @response.parsed_body['issues']['errors'].length
    # Error should throw if metadata type is not supported for the sample's host genome.
    assert_match "#{MetadataValidationErrors.invalid_key_for_host_genome('blood_fed', 'Human')} (row 2)", @response.parsed_body['issues']['errors'][0]

    assert_equal 0, @response.parsed_body['issues']['warnings'].length
  end

  test 'required fields' do
    post user_session_path, params: @user_params

    post validate_csv_for_new_samples_metadata_url, params: {
      metadata: {
        headers: ['sample_name', 'host_genome', 'sample_type', 'nucleotide_type'],
        rows: [
          ['Test Sample', 'Human', 'Whole Blood', 'DNA'],
          ['Test Sample 2', 'Human', 'Whole Blood', '']
        ]
      },
      samples: [
        {
          name: "Test Sample"
        },
        {
          name: "Test Sample 2"
        }
      ]
    }, as: :json

    assert_response :success

    assert_equal 1, @response.parsed_body['issues']['errors'].length
    # Error should throw if row is missing required metadata.
    assert_match MetadataValidationErrors.row_missing_required_metadata('Test Sample 2', ['nucleotide_type'], 2), @response.parsed_body['issues']['errors'][0]

    assert_equal 0, @response.parsed_body['issues']['warnings'].length
  end

  test 'duplicate samples' do
    post user_session_path, params: @user_params

    post validate_csv_for_new_samples_metadata_url, params: {
      metadata: {
        headers: ['sample_name', 'host_genome', 'sample_type', 'nucleotide_type'],
        rows: [
          ['Test Sample', 'Human', 'Whole Blood', 'DNA'],
          ['Test Sample', 'Human', 'Whole Blood', '']
        ]
      },
      samples: [
        {
          name: "Test Sample"
        }
      ]
    }, as: :json

    assert_response :success

    assert_equal 1, @response.parsed_body['issues']['errors'].length
    # Error should throw if row is missing required metadata.
    assert_match MetadataValidationErrors.duplicate_sample('Test Sample'), @response.parsed_body['issues']['errors'][0]

    assert_equal 0, @response.parsed_body['issues']['warnings'].length
  end
end
