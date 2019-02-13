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

  test 'metadata validate basic' do
    post user_session_path, params: @user_params

    post validate_csv_for_new_samples_metadata_url, params: {
      metadata: {
        headers: ['sample_name', 'sample_type', 'blood_fed'],
        rows: [
          ['Test Sample', 'Whole Blood', 'Blood Fed'],
          ['Test Sample 2', 'Whole Blood', 'Partially Blood Fed']
        ]
      },
      samples: [
        {
          name: "Test Sample",
          host_genome_id: @mosquito_host_genome.id
        },
        {
          name: "Test Sample 2",
          host_genome_id: @mosquito_host_genome.id
        }
      ]
    }, as: :json

    assert_response :success

    assert_equal 0, @response.parsed_body['issues']['errors'].length
    assert_equal 0, @response.parsed_body['issues']['warnings'].length
  end

  test 'metadata validate sample names valid' do
    post user_session_path, params: @user_params

    post validate_csv_for_new_samples_metadata_url, params: {
      metadata: {
        headers: ['sample_name', 'sample_type', 'blood_fed'],
        rows: [
          ['Test Sample', 'Whole Blood', 'Blood Fed'],
          ['Test Sample 2', 'Whole Blood', 'Blood Fed']
        ]
      },
      samples: [
        {
          name: "Test Sample",
          host_genome_id: @mosquito_host_genome.id
        }
      ]
    }, as: :json

    assert_response :success

    assert_equal 1, @response.parsed_body['issues']['errors'].length
    # Error should throw if row sample name doesn't match any samples.
    assert_match MetadataValidationErrors.row_invalid_sample_name('Test Sample 2', 2), @response.parsed_body['issues']['errors'][0]

    assert_equal 0, @response.parsed_body['issues']['warnings'].length
  end

  test 'metadata validate fields valid for host genome' do
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
          name: "Test Sample",
          host_genome_id: @mosquito_host_genome.id
        },
        {
          name: "Test Sample 2",
          host_genome_id: @human_host_genome.id
        }
      ]
    }, as: :json

    assert_response :success

    assert_equal 1, @response.parsed_body['issues']['errors'].length
    # Error should throw if metadata type is not supported for the sample's host genome.
    assert_match "#{MetadataValidationErrors.invalid_key_for_host_genome('blood_fed', 'Human')} (row 2)", @response.parsed_body['issues']['errors'][0]

    assert_equal 0, @response.parsed_body['issues']['warnings'].length
  end

  test 'metadata validate required fields' do
    post user_session_path, params: @user_params

    post validate_csv_for_new_samples_metadata_url, params: {
      metadata: {
        headers: ['sample_name', 'sample_type', 'nucleotide_type'],
        rows: [
          ['Test Sample', 'Whole Blood', 'DNA'],
          ['Test Sample 2', 'Whole Blood', '']
        ]
      },
      samples: [
        {
          name: "Test Sample",
          host_genome_id: @human_host_genome.id
        },
        {
          name: "Test Sample 2",
          host_genome_id: @human_host_genome.id
        }
      ]
    }, as: :json

    assert_response :success

    puts @response.parsed_body
    assert_equal 1, @response.parsed_body['issues']['errors'].length
    # Error should throw if row is missing required metadata.
    assert_match MetadataValidationErrors.missing_required_metadata(['nucleotide_type'], 2), @response.parsed_body['issues']['errors'][0]

    assert_equal 0, @response.parsed_body['issues']['warnings'].length
  end
end
