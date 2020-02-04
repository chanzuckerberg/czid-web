require 'test_helper'

# Tests MetadataController validate_csv_for_new_samples endpoint
class MetadataValidateNewSamplesTest < ActionDispatch::IntegrationTest
  include ErrorHelper

  HEADERS_1 = ['sample_name', 'host_genome', 'sample_type', 'blood_fed'].freeze
  HEADERS_2 = ['sample_name', 'host_genome', 'sample_type', 'nucleotide_type'].freeze
  ROW_1 = ['Test Sample', 'Mosquito', 'Whole Blood', 'Blood Fed'].freeze
  ROW_2 = ['Test Sample 2', 'Mosquito', 'Whole Blood', 'Partially Blood Fed'].freeze
  ROW_3 = ['Test Sample', 'Human', 'Whole Blood', 'DNA'].freeze

  setup do
    @user = users(:admin_one)
    @mosquito_host_genome = host_genomes(:mosquito)
    @human_host_genome = host_genomes(:human)
    @metadata_validation_project = projects(:metadata_validation_project)
    @metadata_validation_project_with_water_control =
      projects(:metadata_validation_project_with_water_control)
    @public_project = projects(:public_project)
    @joe_project = projects(:joe_project)
    @user_nonadmin = users(:joe)
  end

  test 'basic' do
    sign_in @user

    post validate_csv_for_new_samples_metadata_url, params: {
      metadata: {
        headers: HEADERS_1,
        rows: [
          ROW_1,
          ROW_2,
        ],
      },
      samples: [
        {
          name: "Test Sample",
          project_id: @metadata_validation_project.id,
        },
        {
          name: "Test Sample 2",
          project_id: @metadata_validation_project.id,
        },
      ],
    }, as: :json

    assert_response :success

    assert_equal 0, @response.parsed_body['issues']['errors'].length
    assert_equal 0, @response.parsed_body['issues']['warnings'].length
  end

  test 'basic with display names' do
    sign_in @user

    post validate_csv_for_new_samples_metadata_url, params: {
      metadata: {
        # Use display_name for sample type so we test that the endpoint accepts display name.
        headers: ['sample_name', 'host_genome', 'Sample Type', 'Blood Fed'],
        rows: [
          ROW_1,
          ROW_2,
        ],
      },
      samples: [
        {
          name: "Test Sample",
          project_id: @metadata_validation_project.id,
        },
        {
          name: "Test Sample 2",
          project_id: @metadata_validation_project.id,
        },
      ],
    }, as: :json

    assert_response :success

    assert_equal 0, @response.parsed_body['issues']['errors'].length
    assert_equal 0, @response.parsed_body['issues']['warnings'].length
  end

  test 'sample names valid' do
    sign_in @user

    post validate_csv_for_new_samples_metadata_url, params: {
      metadata: {
        headers: HEADERS_1,
        rows: [
          ROW_1,
          ['Test Sample 2', 'Mosquito', 'Whole Blood', 'Blood Fed'],
        ],
      },
      samples: [
        {
          name: "Test Sample",
          project_id: @metadata_validation_project.id,
        },
      ],
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
    sign_in @user

    post validate_csv_for_new_samples_metadata_url, params: {
      metadata: {
        headers: HEADERS_1,
        rows: [
          ROW_1,
        ],
      },
      samples: [
        {
          name: "Test Sample",
          project_id: @metadata_validation_project.id,
        },
        {
          name: "Test Sample 2",
          project_id: @metadata_validation_project.id,
        },
      ],
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
    sign_in @user

    post validate_csv_for_new_samples_metadata_url, params: {
      metadata: {
        headers: ['sample_name', 'sample_type', 'nucleotide_type', 'blood_fed'],
        rows: [
          ['Test Sample', 'Whole Blood', '', 'Blood Fed'],
          ['Test Sample 2', 'Whole Blood', 'DNA', 'Blood Fed'],
        ],
      },
      samples: [
        {
          name: "Test Sample",
          project_id: @metadata_validation_project.id,
        },
        {
          name: "Test Sample 2",
          project_id: @metadata_validation_project.id,
        },
      ],
    }, as: :json

    assert_response :success

    assert_equal 1, @response.parsed_body['issues']['errors'].length
    # Error should throw if host genome column is missing
    assert_match MetadataValidationErrors::MISSING_HOST_GENOME_COLUMN, @response.parsed_body['issues']['errors'][0]

    assert_equal 0, @response.parsed_body['issues']['warnings'].length
  end

  # TODO: (gdingle): This behavior will change after removal of admin-only of new host genome input.
  # See https://jira.czi.team/browse/IDSEQ-2051.
  test 'missing or invalid host genome' do
    sign_in @user_nonadmin

    post validate_csv_for_new_samples_metadata_url, params: {
      metadata: {
        headers: HEADERS_2 + ['blood_fed'],
        rows: [
          ['Test Sample', 'Fake Genome', 'Whole Blood', 'RNA', 'Blood Fed'],
          ['Test Sample 2', '', 'Whole Blood', 'DNA', 'Blood Fed'],
        ],
      },
      samples: [
        {
          name: "Test Sample",
          project_id: @joe_project.id,
        },
        {
          name: "Test Sample 2",
          project_id: @joe_project.id,
        },
      ],
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

  # NOTE: is_required is defined in test/fixtures/metadata_fields.yml, not in
  # migrations as in prod. Another reason to use seeds.rb.
  test 'required fields' do
    sign_in @user

    post validate_csv_for_new_samples_metadata_url, params: {
      metadata: {
        headers: HEADERS_2,
        rows: [
          ROW_3,
          ['Test Sample 2', 'Human', '', ''],
        ],
      },
      samples: [
        {
          name: "Test Sample",
          project_id: @metadata_validation_project.id,
        },
        {
          name: "Test Sample 2",
          project_id: @metadata_validation_project.id,
        },
      ],
    }, as: :json

    assert_response :success

    assert_equal 1, @response.parsed_body['issues']['errors'].length
    # Error should throw if row is missing required metadata.
    assert @response.parsed_body['issues']['errors'][0]['isGroup']
    assert_equal ErrorAggregator::ERRORS[:row_missing_required_metadata][:title].call(1, nil), @response.parsed_body['issues']['errors'][0]['caption']
    assert_equal [[2, "Test Sample 2", "Nucleotide Type, Sample Type"]], @response.parsed_body['issues']['errors'][0]['rows']

    assert_equal 0, @response.parsed_body['issues']['warnings'].length
  end

  test 'required fields with water_control' do
    sign_in @user

    post validate_csv_for_new_samples_metadata_url, params: {
      metadata: {
        headers: HEADERS_2 + ['water_control'],
        rows: [
          ['Test Sample', 'Human', 'Whole Blood', 'DNA', 'Yes'],
          ['Test Sample 2', 'Human', '', '', ''],
        ],
      },
      samples: [
        {
          name: "Test Sample",
          project_id: @metadata_validation_project_with_water_control.id,
        },
        {
          name: "Test Sample 2",
          project_id: @metadata_validation_project_with_water_control.id,
        },
      ],
    }, as: :json

    assert_response :success

    issues = @response.parsed_body['issues']
    assert_equal 1, issues['errors'].length
    # Error should throw if row is missing required metadata.
    assert issues['errors'][0]['isGroup']
    assert_equal ErrorAggregator::ERRORS[:row_missing_required_metadata][:title].call(1, nil), issues['errors'][0]['caption']
    assert_equal [[2, "Test Sample 2", "Nucleotide Type, Water Control, Sample Type"]], issues['errors'][0]['rows']

    assert_equal 0, issues['warnings'].length
  end

  test 'duplicate samples' do
    sign_in @user

    post validate_csv_for_new_samples_metadata_url, params: {
      metadata: {
        headers: ['sample_name', 'host_genome', 'sample_type', 'nucleotide_type'],
        rows: [
          ['Test Sample', 'Human', 'Whole Blood', 'DNA'],
          ['Test Sample', 'Human', 'Whole Blood', ''],
        ],
      },
      samples: [
        {
          name: "Test Sample",
          project_id: @metadata_validation_project.id,
        },
      ],
    }, as: :json

    assert_response :success

    assert_equal 1, @response.parsed_body['issues']['errors'].length
    # Error should throw if row is missing required metadata.
    assert @response.parsed_body['issues']['errors'][0]['isGroup']
    assert_equal ErrorAggregator::ERRORS[:row_duplicate_sample][:title].call(1, nil), @response.parsed_body['issues']['errors'][0]['caption']
    assert_equal [[2, "Test Sample"]], @response.parsed_body['issues']['errors'][0]['rows']

    assert_equal 0, @response.parsed_body['issues']['warnings'].length
  end

  test 'invalid metadata fields for host genome' do
    sign_in @user

    post validate_csv_for_new_samples_metadata_url, params: {
      metadata: {
        headers: HEADERS_2 + ['age', 'blood_fed', 'custom field'],
        rows: [
          ['Human Sample', 'Human', 'Foobar', 'DNA', '5', 'Foobar', 'Foobar'],
          ['Mosquito Sample', 'Mosquito', 'Foobar', 'DNA', '10', 'Foobar', 'Foobar'],
        ],
      },
      samples: [
        {
          name: "Human Sample",
          project_id: @metadata_validation_project.id,
        },
        {
          name: "Mosquito Sample",
          project_id: @metadata_validation_project.id,
        },
      ],
    }, as: :json

    assert_equal 1, @response.parsed_body['issues']['errors'].length
    # Error should throw if user attempts to add a metadata field that isn't compatible with the host genome.
    assert @response.parsed_body['issues']['errors'][0]['isGroup']
    assert_equal ErrorAggregator::ERRORS[:invalid_key_for_host_genome][:title].call(3, nil), @response.parsed_body['issues']['errors'][0]['caption']
    assert_equal [
      [1, "Human Sample", "Human", "blood_fed"],
      [2, "Mosquito Sample", "Mosquito", "nucleotide_type"],
      [2, "Mosquito Sample", "Mosquito", "age"],
    ], @response.parsed_body['issues']['errors'][0]['rows']
  end

  test 'duplicate columns' do
    sign_in @user

    post validate_csv_for_new_samples_metadata_url, params: {
      metadata: {
        headers: ['sample_name', 'Sample Name', 'host_genome', 'sample_type', 'Sample Type', 'Host Genome', 'Custom Field', 'Custom Field'],
        rows: [
          ['Test Sample', 'Foobar', 'Foobar', 'Foobar', 'Foobar', 'Foobar', 'Foobar', 'Foobar'],
        ],
      },
      samples: [
        {
          name: "Test Sample",
          project_id: @metadata_validation_project.id,
        },
      ],
    }, as: :json

    assert_equal 1, @response.parsed_body['issues']['errors'].length

    # Error should throw if there are multiple columns with the same name.
    assert @response.parsed_body['issues']['errors'][0]['isGroup']
    assert_equal ErrorAggregator::ERRORS[:duplicate_columns][:title].call(4, nil), @response.parsed_body['issues']['errors'][0]['caption']
    assert_equal [[1, "Sample Name", 0], [4, "Sample Type", 3], [5, "Host Genome", 2], [7, "Custom Field", 6]], @response.parsed_body['issues']['errors'][0]['rows']

    assert_equal 0, @response.parsed_body['issues']['warnings'].length
  end

  test 'core and custom fields' do
    sign_in @user

    post validate_csv_for_new_samples_metadata_url, params: {
      metadata: {
        headers: HEADERS_2 + ['example_core_field', 'Custom Field 1', 'Custom Field 2'],
        rows: [
          ROW_3 + ['Foobar', 'Foobar', 'Foobar'],
        ],
      },
      samples: [
        {
          name: "Test Sample",
          project_id: @metadata_validation_project.id,
        },
      ],
    }, as: :json

    assert_response :success

    assert_equal 0, @response.parsed_body['issues']['errors'].length
    assert_equal 1, @response.parsed_body['issues']['warnings'].length

    assert @response.parsed_body['issues']['warnings'][0]['isGroup']
    assert_equal ErrorAggregator::ERRORS[:custom_field_creation][:title].call(2, nil), @response.parsed_body['issues']['warnings'][0]['caption']
    assert_equal [
      [6, "Custom Field 1"],
      [7, "Custom Field 2"],
    ], @response.parsed_body['issues']['warnings'][0]['rows']
  end

  test 'invalid project' do
    sign_in @user

    post validate_csv_for_new_samples_metadata_url, params: {
      metadata: {
        headers: HEADERS_2 + ['example_core_field', 'Custom Field 1', 'Custom Field 2'],
        rows: [
          ROW_3 + ['Foobar', 'Foobar', 'Foobar'],
        ],
      },
      samples: [
        {
          name: "Test Sample",
          project_id: 1234,
        },
      ],
    }, as: :json

    assert_response :success

    assert_equal 1, @response.parsed_body['issues']['errors'].length
    # Error should throw if sample project is invalid
    assert @response.parsed_body['issues']['errors'][0]['isGroup']
    assert_equal ErrorAggregator::ERRORS[:row_invalid_project_id][:title].call(1, nil), @response.parsed_body['issues']['errors'][0]['caption']
    assert_equal [[1, "Test Sample"]], @response.parsed_body['issues']['errors'][0]['rows']
  end

  test 'metadata validate values valid' do
    sign_in @user

    post validate_csv_for_new_samples_metadata_url(@metadata_validation_project), params: {
      metadata: {
        headers: ['sample_name', 'host_genome', 'sample_type', 'age', 'admission_date', 'blood_fed', 'nucleotide_type', 'reported_sex'],
        rows: [
          ['Test Sample Human', 'Human', 'Whole Blood', 'foobar', 'foobar', '', 'foobar', ''],
          ['Test Sample Mosquito', 'Mosquito', 'Whole Blood', '', '', 'foobar', '', 'foobar'],
        ],
      },
      samples: [
        {
          name: "Test Sample Human",
          project_id: @metadata_validation_project.id,
        },
        {
          name: "Test Sample Mosquito",
          project_id: @metadata_validation_project.id,
        },
      ],
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
    sign_in @user

    post validate_csv_for_new_samples_metadata_url(@metadata_validation_project), params: {
      metadata: {
        headers: ['sample_name', 'host_genome', 'sample_type', 'age', 'collection_date', 'nucleotide_type'],
        rows: [
          ['Test Sample Human', 'Human', 'Whole Blood', '12', '2018-01', 'DNA'],
          ['Test Sample Human 2', 'Human', 'Whole Blood', '12', '2018-01-01', 'DNA'],
          ['Test Sample Human 3', 'Human', 'Whole Blood', '12', '01/2018', 'DNA'],
          ['Test Sample Human 4', 'Human', 'Whole Blood', '12', '01/01/18', 'DNA'],
          ['Test Sample Human 5', 'Human', 'Whole Blood', '12', '2018-01abc', 'DNA'],
          ['Test Sample Human 6', 'Human', 'Whole Blood', '12', 'abc01/2018', 'DNA'],
          ['Test Sample Mosquito', 'Mosquito', 'Abdomen', '', '2018-01', ''],
          ['Test Sample Mosquito 2', 'Mosquito', 'Abdomen', '', '2018-01-01', ''],
          ['Test Sample Mosquito 3', 'Mosquito', 'Abdomen', '', '01/2018', ''],
          ['Test Sample Mosquito 4', 'Mosquito', 'Abdomen', '', '01/01/18', ''],
          ['Test Sample Mosquito 5', 'Mosquito', 'Abdomen', '', '2018-01abc', ''],
          ['Test Sample Mosquito 6', 'Mosquito', 'Abdomen', '', 'abc01/2018', ''],
        ],
      },
      samples: [
        {
          name: "Test Sample Human",
          project_id: @metadata_validation_project.id,
        },
        {
          name: "Test Sample Human 2",
          project_id: @metadata_validation_project.id,
        },
        {
          name: "Test Sample Human 3",
          project_id: @metadata_validation_project.id,
        },
        {
          name: "Test Sample Human 4",
          project_id: @metadata_validation_project.id,
        },
        {
          name: "Test Sample Human 5",
          project_id: @metadata_validation_project.id,
        },
        {
          name: "Test Sample Human 6",
          project_id: @metadata_validation_project.id,
        },
        {
          name: "Test Sample Mosquito",
          project_id: @metadata_validation_project.id,
        },
        {
          name: "Test Sample Mosquito 2",
          project_id: @metadata_validation_project.id,
        },
        {
          name: "Test Sample Mosquito 3",
          project_id: @metadata_validation_project.id,
        },
        {
          name: "Test Sample Mosquito 4",
          project_id: @metadata_validation_project.id,
        },
        {
          name: "Test Sample Mosquito 5",
          project_id: @metadata_validation_project.id,
        },
        {
          name: "Test Sample Mosquito 6",
          project_id: @metadata_validation_project.id,
        },
      ],
    }, as: :json

    assert_response :success

    assert_equal 2, @response.parsed_body['issues']['errors'].length
    # Error should throw if invalid float is passed for float data type.
    assert @response.parsed_body['issues']['errors'][0]['isGroup']
    assert @response.parsed_body['issues']['errors'][0]['caption'].starts_with?("4 invalid values for \"Collection Date\" (column 5)")
    assert @response.parsed_body['issues']['errors'][0]['caption'].ends_with?("(for human samples)")
    assert_equal [
      [2, "Test Sample Human 2", "2018-01-01"],
      [4, "Test Sample Human 4", "01/01/18"],
      [5, "Test Sample Human 5", "2018-01abc"],
      [6, "Test Sample Human 6", "abc01/2018"],
    ], @response.parsed_body['issues']['errors'][0]['rows']

    assert @response.parsed_body['issues']['errors'][1]['isGroup']
    assert @response.parsed_body['issues']['errors'][1]['caption'].starts_with?("2 invalid values for \"Collection Date\" (column 5)")
    assert !@response.parsed_body['issues']['errors'][1]['caption'].ends_with?("(for human samples)")
    assert_equal [
      [11, "Test Sample Mosquito 5", "2018-01abc"],
      [12, "Test Sample Mosquito 6", "abc01/2018"],
    ], @response.parsed_body['issues']['errors'][1]['rows']

    assert_equal 0, @response.parsed_body['issues']['warnings'].length
  end

  test 'joe cannot vaidate metadata for new samples against a public project' do
    sign_in @user_nonadmin

    post validate_csv_for_new_samples_metadata_url, params: {
      metadata: {
        headers: HEADERS_2 + ['example_core_field', 'Custom Field 1', 'Custom Field 2'],
        rows: [
          ROW_3 + ['Foobar', 'Foobar', 'Foobar'],
        ],
      },
      samples: [
        {
          name: "Test Sample",
          project_id: @public_project.id,
        },
      ],
    }, as: :json

    assert_response :success

    assert_equal 1, @response.parsed_body['issues']['errors'].length
    # Error should throw if sample project is invalid
    assert @response.parsed_body['issues']['errors'][0]['isGroup']
    assert_equal ErrorAggregator::ERRORS[:row_invalid_project_id][:title].call(1, nil), @response.parsed_body['issues']['errors'][0]['caption']
    assert_equal [[1, "Test Sample"]], @response.parsed_body['issues']['errors'][0]['rows']
  end

  test 'joe cannot validate metadata for new samples against a private project' do
    sign_in @user_nonadmin

    post validate_csv_for_new_samples_metadata_url, params: {
      metadata: {
        headers: HEADERS_2 + ['example_core_field', 'Custom Field 1', 'Custom Field 2'],
        rows: [
          ROW_3 + ['Foobar', 'Foobar', 'Foobar'],
        ],
      },
      samples: [
        {
          name: "Test Sample",
          project_id: @metadata_validation_project.id,
        },
      ],
    }, as: :json

    assert_response :success

    assert_equal 1, @response.parsed_body['issues']['errors'].length
    # Error should throw if sample project is invalid
    assert @response.parsed_body['issues']['errors'][0]['isGroup']
    assert_equal ErrorAggregator::ERRORS[:row_invalid_project_id][:title].call(1, nil), @response.parsed_body['issues']['errors'][0]['caption']
    assert_equal [[1, "Test Sample"]], @response.parsed_body['issues']['errors'][0]['rows']
  end

  test 'joe can validate metadata for new samples against a project that he is a member of' do
    sign_in @user_nonadmin

    post validate_csv_for_new_samples_metadata_url, params: {
      metadata: {
        headers: HEADERS_2 + ['example_core_field', 'Custom Field 1', 'Custom Field 2'],
        rows: [
          ROW_3 + ['Foobar', 'Foobar', 'Foobar'],
        ],
      },
      samples: [
        {
          name: "Test Sample",
          project_id: @joe_project.id,
        },
      ],
    }, as: :json

    assert_response :success

    assert_equal 0, @response.parsed_body['issues']['errors'].length
  end
end
