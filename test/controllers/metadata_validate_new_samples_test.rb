require 'test_helper'

# Tests MetadataController validate_csv_for_new_samples endpoint
class MetadataValudateNewSamplesTest < ActionDispatch::IntegrationTest
  include ErrorHelper

  setup do
    @user = users(:one)
    @user_params = { 'user[email]' => @user.email, 'user[password]' => 'password' }
    @mosquito_host_genome = host_genomes(:mosquito)
    @human_host_genome = host_genomes(:human)
    @metadata_validation_project = projects(:metadata_validation_project)
    @public_project = projects(:public_project)
    @joe_project = projects(:joe_project)
    @user_nonadmin = users(:joe)
    @user_nonadmin_params = { 'user[email]' => @user_nonadmin.email, 'user[password]' => 'passwordjoe' }
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
          name: "Test Sample",
          project_id: @metadata_validation_project.id
        },
        {
          name: "Test Sample 2",
          project_id: @metadata_validation_project.id
        }
      ]
    }, as: :json

    assert_response :success

    assert_equal 0, @response.parsed_body['issues']['errors'].length
    assert_equal 0, @response.parsed_body['issues']['warnings'].length
  end

  test 'basic with display names' do
    post user_session_path, params: @user_params

    post validate_csv_for_new_samples_metadata_url, params: {
      metadata: {
        # Use display_name for sample type so we test that the endpoint accepts display name.
        headers: ['sample_name', 'host_genome', 'Sample Type', 'Blood Fed'],
        rows: [
          ['Test Sample', 'Mosquito', 'Whole Blood', 'Blood Fed'],
          ['Test Sample 2', 'Mosquito', 'Whole Blood', 'Partially Blood Fed']
        ]
      },
      samples: [
        {
          name: "Test Sample",
          project_id: @metadata_validation_project.id
        },
        {
          name: "Test Sample 2",
          project_id: @metadata_validation_project.id
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
          name: "Test Sample",
          project_id: @metadata_validation_project.id
        }
      ]
    }, as: :json

    assert_response :success

    assert_equal 1, @response.parsed_body['issues']['errors'].length
    # Error should throw if row sample name doesn't match any samples.
    assert @response.parsed_body['issues']['errors'][0]['isGroup']
    assert_equal ErrorAggregator::ERRORS[:no_matching_sample_new][:title].call(1, nil), @response.parsed_body['issues']['errors'][0]['caption']
    assert_equal [[2, "Test Sample 2"]], @response.parsed_body['issues']['errors'][0]['rows']

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
          name: "Test Sample",
          project_id: @metadata_validation_project.id
        },
        {
          name: "Test Sample 2",
          project_id: @metadata_validation_project.id
        }
      ]
    }, as: :json

    assert_response :success

    assert_equal 1, @response.parsed_body['issues']['errors'].length
    # Error should throw if a sample is missing from the metadata.
    assert @response.parsed_body['issues']['errors'][0]['isGroup']
    assert_equal ErrorAggregator::ERRORS[:missing_sample][:title].call(1, nil), @response.parsed_body['issues']['errors'][0]['caption']
    assert_equal [["Test Sample 2"]], @response.parsed_body['issues']['errors'][0]['rows']

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
          name: "Test Sample",
          project_id: @metadata_validation_project.id
        },
        {
          name: "Test Sample 2",
          project_id: @metadata_validation_project.id
        }
      ]
    }, as: :json

    assert_response :success

    assert_equal 1, @response.parsed_body['issues']['errors'].length
    # Error should throw if host genome column is missing
    assert_match MetadataValidationErrors::MISSING_HOST_GENOME_COLUMN, @response.parsed_body['issues']['errors'][0]

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
          name: "Test Sample",
          project_id: @metadata_validation_project.id
        },
        {
          name: "Test Sample 2",
          project_id: @metadata_validation_project.id
        }
      ]
    }, as: :json

    assert_response :success

    assert_equal 2, @response.parsed_body['issues']['errors'].length
    # Error should throw if host genome is invalid for a row.
    assert @response.parsed_body['issues']['errors'][0]['isGroup']
    assert_equal ErrorAggregator::ERRORS[:row_invalid_host_genome][:title].call(1, nil), @response.parsed_body['issues']['errors'][0]['caption']
    assert_equal [[1, "Test Sample", "Fake Genome"]], @response.parsed_body['issues']['errors'][0]['rows']
    # Error should throw if host genome is missing for a row.
    assert @response.parsed_body['issues']['errors'][1]['isGroup']
    assert_equal ErrorAggregator::ERRORS[:row_missing_host_genome][:title].call(1, nil), @response.parsed_body['issues']['errors'][1]['caption']
    assert_equal [[2, "Test Sample 2"]], @response.parsed_body['issues']['errors'][1]['rows']

    assert_equal 0, @response.parsed_body['issues']['warnings'].length
  end

  test 'required fields' do
    post user_session_path, params: @user_params

    post validate_csv_for_new_samples_metadata_url, params: {
      metadata: {
        headers: ['sample_name', 'host_genome', 'sample_type', 'nucleotide_type'],
        rows: [
          ['Test Sample', 'Human', 'Whole Blood', 'DNA'],
          ['Test Sample 2', 'Human', '', '']
        ]
      },
      samples: [
        {
          name: "Test Sample",
          project_id: @metadata_validation_project.id
        },
        {
          name: "Test Sample 2",
          project_id: @metadata_validation_project.id
        }
      ]
    }, as: :json

    assert_response :success

    assert_equal 1, @response.parsed_body['issues']['errors'].length
    # Error should throw if row is missing required metadata.
    assert @response.parsed_body['issues']['errors'][0]['isGroup']
    assert_equal ErrorAggregator::ERRORS[:row_missing_required_metadata][:title].call(1, nil), @response.parsed_body['issues']['errors'][0]['caption']
    assert_equal [[2, "Test Sample 2", "Nucleotide Type, Sample Type"]], @response.parsed_body['issues']['errors'][0]['rows']

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
          name: "Test Sample",
          project_id: @metadata_validation_project.id
        }
      ]
    }, as: :json

    assert_response :success

    assert_equal 1, @response.parsed_body['issues']['errors'].length
    # Error should throw if row is missing required metadata.
    assert @response.parsed_body['issues']['errors'][0]['isGroup']
    assert_equal ErrorAggregator::ERRORS[:row_duplicate_sample][:title].call(1, nil), @response.parsed_body['issues']['errors'][0]['caption']
    assert_equal [[2, "Test Sample"]], @response.parsed_body['issues']['errors'][0]['rows']

    assert_equal 0, @response.parsed_body['issues']['warnings'].length
  end

  test 'core and custom fields' do
    post user_session_path, params: @user_params

    post validate_csv_for_new_samples_metadata_url, params: {
      metadata: {
        headers: ['sample_name', 'host_genome', 'sample_type', 'nucleotide_type', 'example_core_field', 'Custom Field 1', 'Custom Field 2'],
        rows: [
          ['Test Sample', 'Human', 'Whole Blood', 'DNA', 'Foobar', 'Foobar', 'Foobar']
        ]
      },
      samples: [
        {
          name: "Test Sample",
          project_id: @metadata_validation_project.id
        }
      ]
    }, as: :json

    assert_response :success

    assert_equal 0, @response.parsed_body['issues']['errors'].length
    assert_equal 1, @response.parsed_body['issues']['warnings'].length

    assert @response.parsed_body['issues']['warnings'][0]['isGroup']
    assert_equal ErrorAggregator::ERRORS[:custom_field_creation][:title].call(2, nil), @response.parsed_body['issues']['warnings'][0]['caption']
    assert_equal [
      [6, "Custom Field 1"],
      [7, "Custom Field 2"]
    ], @response.parsed_body['issues']['warnings'][0]['rows']
  end

  test 'invalid project' do
    post user_session_path, params: @user_params

    post validate_csv_for_new_samples_metadata_url, params: {
      metadata: {
        headers: ['sample_name', 'host_genome', 'sample_type', 'nucleotide_type', 'example_core_field', 'Custom Field 1', 'Custom Field 2'],
        rows: [
          ['Test Sample', 'Human', 'Whole Blood', 'DNA', 'Foobar', 'Foobar', 'Foobar']
        ]
      },
      samples: [
        {
          name: "Test Sample",
          project_id: 1234
        }
      ]
    }, as: :json

    assert_response :success

    assert_equal 1, @response.parsed_body['issues']['errors'].length
    # Error should throw if sample project is invalid
    assert @response.parsed_body['issues']['errors'][0]['isGroup']
    assert_equal ErrorAggregator::ERRORS[:row_invalid_project_id][:title].call(1, nil), @response.parsed_body['issues']['errors'][0]['caption']
    assert_equal [[1, "Test Sample"]], @response.parsed_body['issues']['errors'][0]['rows']
  end

  test 'metadata validate values valid' do
    post user_session_path, params: @user_params

    post validate_csv_for_new_samples_metadata_url(@metadata_validation_project), params: {
      metadata: {
        headers: ['sample_name', 'host_genome', 'sample_type', 'age', 'admission_date', 'blood_fed', 'nucleotide_type', 'reported_sex'],
        rows: [
          ['Test Sample Human', 'Human', 'Whole Blood', 'foobar', 'foobar', 'foobar', 'foobar', 'foobar'],
          ['Test Sample Mosquito', 'Mosquito', 'Whole Blood', 'foobar', 'foobar', 'foobar', 'foobar', 'foobar']
        ]
      },
      samples: [
        {
          name: "Test Sample Human",
          project_id: @metadata_validation_project.id
        },
        {
          name: "Test Sample Mosquito",
          project_id: @metadata_validation_project.id
        }
      ]
    }, as: :json

    assert_response :success

    assert_equal 4, @response.parsed_body['issues']['errors'].length
    # Error should throw if invalid float is passed for float data type.
    assert @response.parsed_body['issues']['errors'][0]['isGroup']
    assert @response.parsed_body['issues']['errors'][0]['caption'].starts_with?("1 invalid values for \"Age\" (column 4)")
    assert_equal [[1, "Test Sample Human", "foobar"]], @response.parsed_body['issues']['errors'][0]['rows']
    # Error should throw if invalid date is passed for date data type.
    assert @response.parsed_body['issues']['errors'][1]['isGroup']
    assert @response.parsed_body['issues']['errors'][1]['caption'].starts_with?("1 invalid values for \"Admission Date\" (column 5)")
    assert_equal [[1, "Test Sample Human", "foobar"]], @response.parsed_body['issues']['errors'][1]['rows']
    # Error should throw if string value doesn't match fixed list of string options.
    assert @response.parsed_body['issues']['errors'][2]['isGroup']
    assert @response.parsed_body['issues']['errors'][2]['caption'].starts_with?("1 invalid values for \"Nucleotide Type\" (column 7)")
    assert_equal [[1, "Test Sample Human", "foobar"]], @response.parsed_body['issues']['errors'][2]['rows']
    # Error should throw if string value doesn't match fixed list of string options.
    assert @response.parsed_body['issues']['errors'][3]['isGroup']
    assert @response.parsed_body['issues']['errors'][3]['caption'].starts_with?("1 invalid values for \"Reported Sex\" (column 8)")
    assert_equal [[2, "Test Sample Mosquito", "foobar"]], @response.parsed_body['issues']['errors'][3]['rows']

    assert_equal 0, @response.parsed_body['issues']['warnings'].length
  end

  test 'metadata validate accepts various date formats' do
    post user_session_path, params: @user_params

    post validate_csv_for_new_samples_metadata_url(@metadata_validation_project), params: {
      metadata: {
        headers: ['sample_name', 'host_genome', 'sample_type', 'age', 'admission_date', 'nucleotide_type'],
        rows: [
          ['Test Sample Human', 'Human', 'Whole Blood', '12', '2018-01', 'DNA'],
          ['Test Sample Human 2', 'Human', 'Whole Blood', '12', '2018-01-01', 'DNA'],
          ['Test Sample Human 3', 'Human', 'Whole Blood', '12', '01/2018', 'DNA'],
          ['Test Sample Human 4', 'Human', 'Whole Blood', '12', '01/01/2018', 'DNA']
        ]
      },
      samples: [
        {
          name: "Test Sample Human",
          project_id: @metadata_validation_project.id
        },
        {
          name: "Test Sample Human 2",
          project_id: @metadata_validation_project.id
        },
        {
          name: "Test Sample Human 3",
          project_id: @metadata_validation_project.id
        },
        {
          name: "Test Sample Human 4",
          project_id: @metadata_validation_project.id
        }
      ]
    }, as: :json

    assert_response :success

    assert_equal 0, @response.parsed_body['issues']['errors'].length
    assert_equal 0, @response.parsed_body['issues']['warnings'].length
  end

  test 'nonadmin user public project' do
    post user_session_path, params: @user_nonadmin_params

    post validate_csv_for_new_samples_metadata_url, params: {
      metadata: {
        headers: ['sample_name', 'host_genome', 'sample_type', 'nucleotide_type', 'example_core_field', 'Custom Field 1', 'Custom Field 2'],
        rows: [
          ['Test Sample', 'Human', 'Whole Blood', 'DNA', 'Foobar', 'Foobar', 'Foobar']
        ]
      },
      samples: [
        {
          name: "Test Sample",
          project_id: @public_project.id
        }
      ]
    }, as: :json

    assert_response :success

    assert_equal 1, @response.parsed_body['issues']['errors'].length
    # Error should throw if sample project is invalid
    assert @response.parsed_body['issues']['errors'][0]['isGroup']
    assert_equal ErrorAggregator::ERRORS[:row_invalid_project_id][:title].call(1, nil), @response.parsed_body['issues']['errors'][0]['caption']
    assert_equal [[1, "Test Sample"]], @response.parsed_body['issues']['errors'][0]['rows']
  end

  test 'nonadmin user private project' do
    post user_session_path, params: @user_nonadmin_params

    post validate_csv_for_new_samples_metadata_url, params: {
      metadata: {
        headers: ['sample_name', 'host_genome', 'sample_type', 'nucleotide_type', 'example_core_field', 'Custom Field 1', 'Custom Field 2'],
        rows: [
          ['Test Sample', 'Human', 'Whole Blood', 'DNA', 'Foobar', 'Foobar', 'Foobar']
        ]
      },
      samples: [
        {
          name: "Test Sample",
          project_id: @metadata_validation_project.id
        }
      ]
    }, as: :json

    assert_response :success

    assert_equal 1, @response.parsed_body['issues']['errors'].length
    # Error should throw if sample project is invalid
    assert @response.parsed_body['issues']['errors'][0]['isGroup']
    assert_equal ErrorAggregator::ERRORS[:row_invalid_project_id][:title].call(1, nil), @response.parsed_body['issues']['errors'][0]['caption']
    assert_equal [[1, "Test Sample"]], @response.parsed_body['issues']['errors'][0]['rows']
  end

  test 'nonadmin user own project' do
    post user_session_path, params: @user_nonadmin_params

    post validate_csv_for_new_samples_metadata_url, params: {
      metadata: {
        headers: ['sample_name', 'host_genome', 'sample_type', 'nucleotide_type', 'example_core_field', 'Custom Field 1', 'Custom Field 2'],
        rows: [
          ['Test Sample', 'Human', 'Whole Blood', 'DNA', 'Foobar', 'Foobar', 'Foobar']
        ]
      },
      samples: [
        {
          name: "Test Sample",
          project_id: @joe_project.id
        }
      ]
    }, as: :json

    assert_response :success

    assert_equal 0, @response.parsed_body['issues']['errors'].length
  end
end
