require 'test_helper'

# Tests SamplesController bulk_upload_with_metadata
class SamplesBulkUploadTest < ActionDispatch::IntegrationTest
  include ErrorHelper

  setup do
    @metadata_validation_project = projects(:metadata_validation_project)
    @joe_project = projects(:joe_project)
    @public_project = projects(:public_project)
    @user = users(:admin_one)
    @host_genome_human = host_genomes(:human)
    @host_genome_mosquito = host_genomes(:mosquito)
    @core_field = metadata_fields(:core_field)
    @user_nonadmin = users(:joe)
    @client_version = "3.0.0"
  end

  test 'bulk upload basic remote' do
    sign_in @user

    post bulk_upload_with_metadata_samples_url, params: {
      client: "web",
      metadata: {
        "RR004_water_2_S23A" => {
          'sex' => 'Female',
          'age' => 100,
          'admission_date' => '2018-01',
          'sample_type' => 'blood',
          'nucleotide_type' => 'DNA',
        },
        "RR004_water_2_S23B" => {
          'sex' => 'Male',
          'age' => 50,
          'sample_type' => 'CSF',
          'nucleotide_type' => 'RNA',
        },
      },
      samples: [
        {
          host_genome_id: @host_genome_human.id,
          input_files_attributes: [
            {
              name: "RR004_water_2_S23D_R1_001.fastq",
              source: "s3://idseq-samples-test/markazhang/RR004_water_2_S23D_R1_001.fastq",
              source_type: "s3",
              upload_client: "web",
              file_type: "fastq",
            },
            {
              name: "RR004_water_2_S23D_R2_001.fastq",
              source: "s3://idseq-samples-test/markazhang/RR004_water_2_S23D_R2_001.fastq",
              source_type: "s3",
              upload_client: "web",
              file_type: "fastq",
            },
          ],
          name: "RR004_water_2_S23A",
          # project_id is currently passed from front-end as a string, so need to test this works.
          project_id: String(@metadata_validation_project.id),
          status: "created",
        },
        {
          host_genome_id: @host_genome_human.id,
          input_files_attributes: [
            {
              name: "RR004_water_2_S23D_R1_001.fastq",
              source: "s3://idseq-samples-test/markazhang/RR004_water_2_S23D_R1_001.fastq",
              source_type: "s3",
              upload_client: "web",
              file_type: "fastq",
            },
            {
              name: "RR004_water_2_S23D_R2_001.fastq",
              source: "s3://idseq-samples-test/markazhang/RR004_water_2_S23D_R2_001.fastq",
              source_type: "s3",
              upload_client: "web",
              file_type: "fastq",
            },
          ],
          name: "RR004_water_2_S23B",
          # project_id is currently passed from front-end as a string, so need to test this works.
          project_id: String(@metadata_validation_project.id),
          status: "created",
        },
      ],
    }, as: :json

    assert_response :success
    assert_equal 0, @response.parsed_body["errors"].length

    assert_equal 1, Sample.where(name: "RR004_water_2_S23A").length
    sample_id = Sample.where(name: "RR004_water_2_S23A").first.id
    assert_equal 5, Metadatum.where(sample_id: sample_id).length
    assert_equal 1, Sample.where(name: "RR004_water_2_S23B").length
    sample_id = Sample.where(name: "RR004_water_2_S23B").first.id
    assert_equal 4, Metadatum.where(sample_id: sample_id).length
  end

  test 'bulk upload basic local' do
    sign_in @user

    post bulk_upload_with_metadata_samples_url, params: {
      client: "web",
      metadata: {
        "RR004_water_2_S23A" => {
          'sex' => 'Female',
          'age' => 100,
          'admission_date' => '2018-01',
          'sample_type' => 'blood',
          'nucleotide_type' => 'DNA',
        },
        "RR004_water_2_S23B" => {
          'sex' => 'Male',
          'age' => 50,
          'sample_type' => 'CSF',
          'nucleotide_type' => 'RNA',
        },
      },
      samples: [
        {
          host_genome_id: @host_genome_human.id,
          input_files_attributes: [
            {
              parts: "RR004_water_2_S23A_R1_001.fastq",
              source: "RR004_water_2_S23A_R1_001.fastq",
              source_type: "local",
              upload_client: "web",
              file_type: "fastq",
            },
            {
              parts: "RR004_water_2_S23A_R2_001.fastq",
              source: "RR004_water_2_S23A_R2_001.fastq",
              source_type: "local",
              upload_client: "web",
              file_type: "fastq",
            },
          ],
          name: "RR004_water_2_S23A",
          project_id: String(@metadata_validation_project.id),
          status: "created",
        },
        {
          host_genome_id: @host_genome_human.id,
          input_files_attributes: [
            {
              parts: "RR004_water_2_S23B_R1_001.fastq",
              source: "RR004_water_2_S23B_R1_001.fastq",
              source_type: "local",
              upload_client: "web",
              file_type: "fastq",
            },
            {
              parts: "RR004_water_2_S23B_R2_001.fastq",
              source: "RR004_water_2_S23B_R2_001.fastq",
              source_type: "local",
              upload_client: "web",
              file_type: "fastq",
            },
          ],
          name: "RR004_water_2_S23B",
          project_id: String(@metadata_validation_project.id),
          status: "created",
        },
      ],
    }, as: :json

    assert_response :success
    assert_equal 0, @response.parsed_body["errors"].length

    assert_equal 1, Sample.where(name: "RR004_water_2_S23A").length
    sample_id = Sample.where(name: "RR004_water_2_S23A").first.id
    assert_equal 5, Metadatum.where(sample_id: sample_id).length
    assert_equal 1, Sample.where(name: "RR004_water_2_S23B").length
    sample_id = Sample.where(name: "RR004_water_2_S23B").first.id
    assert_equal 4, Metadatum.where(sample_id: sample_id).length
  end

  # Test that using the display name for metadata fields also works.
  test 'bulk upload with display names for metadata' do
    sign_in @user

    post bulk_upload_with_metadata_samples_url, params: {
      client: "web",
      metadata: {
        "RR004_water_2_S23A" => {
          'Sex' => 'Female',
          'Age' => 100,
          'Admission Date' => '2018-01',
          'Sample Type' => 'blood',
          'Nucleotide Type' => 'DNA',
        },
      },
      samples: [
        {
          host_genome_id: @host_genome_human.id,
          input_files_attributes: [
            {
              name: "RR004_water_2_S23D_R1_001.fastq",
              source: "s3://idseq-samples-test/markazhang/RR004_water_2_S23D_R1_001.fastq",
              source_type: "s3",
              upload_client: "web",
              file_type: "fastq",
            },
            {
              name: "RR004_water_2_S23D_R2_001.fastq",
              source: "s3://idseq-samples-test/markazhang/RR004_water_2_S23D_R2_001.fastq",
              source_type: "s3",
              upload_client: "web",
              file_type: "fastq",
            },
          ],
          name: "RR004_water_2_S23A",
          # project_id is currently passed from front-end as a string, so need to test this works.
          project_id: String(@metadata_validation_project.id),
          status: "created",
        },
      ],
    }, as: :json

    assert_response :success
    assert_equal 0, @response.parsed_body["errors"].length

    assert_equal 1, Sample.where(name: "RR004_water_2_S23A").length
    sample_id = Sample.where(name: "RR004_water_2_S23A").first.id
    assert_equal 5, Metadatum.where(sample_id: sample_id).length
  end

  test 'bulk upload old client' do
    sign_in @user

    post bulk_upload_with_metadata_samples_url, params: {
      client: "0.4.0",
      metadata: {
        "RR004_water_2_S23A" => {
          'sex' => 'Female',
          'age' => 100,
          'admission_date' => '2018-01',
          'sample_type' => 'blood',
          'nucleotide_type' => 'DNA',
        },
      },
      samples: [
        {
          host_genome_id: @host_genome_human.id,
          input_files_attributes: [
            {
              parts: "RR004_water_2_S23A_R1_001.fastq",
              source: "RR004_water_2_S23A_R1_001.fastq",
              source_type: "local",
              upload_client: "web",
              file_type: "fastq",
            },
            {
              parts: "RR004_water_2_S23A_R2_001.fastq",
              source: "RR004_water_2_S23A_R2_001.fastq",
              source_type: "local",
              upload_client: "web",
              file_type: "fastq",
            },
          ],
          name: "RR004_water_2_S23A",
          project_id: String(@metadata_validation_project.id),
          status: "created",
        },
      ],
    }, as: :json

    assert_response :upgrade_required
    assert_equal "upgrade_required", @response.parsed_body["status"]
  end

  test 'bulk upload new client' do
    sign_in @user

    post bulk_upload_with_metadata_samples_url, params: {
      client: @client_version,
      metadata: {
        "RR004_water_2_S23A" => {
          'sex' => 'Female',
          'age' => 100,
          'admission_date' => '2018-01',
          'sample_type' => 'blood',
          'nucleotide_type' => 'DNA',
        },
      },
      samples: [
        {
          host_genome_id: @host_genome_human.id,
          input_files_attributes: [
            {
              parts: "RR004_water_2_S23A_R1_001.fastq",
              source: "RR004_water_2_S23A_R1_001.fastq",
              source_type: "local",
              upload_client: "web",
              file_type: "fastq",
            },
            {
              parts: "RR004_water_2_S23A_R2_001.fastq",
              source: "RR004_water_2_S23A_R2_001.fastq",
              source_type: "local",
              upload_client: "web",
              file_type: "fastq",
            },
          ],
          name: "RR004_water_2_S23A",
          project_id: String(@metadata_validation_project.id),
          status: "created",
        },
      ],
    }, as: :json

    assert_response :success
    assert_equal 0, @response.parsed_body["errors"].length

    assert_equal 1, Sample.where(name: "RR004_water_2_S23A").length
    sample_id = Sample.where(name: "RR004_water_2_S23A").first.id
    assert_equal 5, Metadatum.where(sample_id: sample_id).length
  end

  test 'bulk upload missing required metadata' do
    sign_in @user

    post bulk_upload_with_metadata_samples_url, params: {
      client: @client_version,
      metadata: {
        "RR004_water_2_S23A" => {
          'sex' => 'Female',
          'age' => 100,
          'admission_date' => '2018-01',
        },
      },
      samples: [
        {
          host_genome_id: @host_genome_human.id,
          input_files_attributes: [
            {
              parts: "RR004_water_2_S23A_R1_001.fastq",
              source: "RR004_water_2_S23A_R1_001.fastq",
              source_type: "local",
              upload_client: "web",
              file_type: "fastq",
            },
            {
              parts: "RR004_water_2_S23A_R2_001.fastq",
              source: "RR004_water_2_S23A_R2_001.fastq",
              source_type: "local",
              upload_client: "web",
              file_type: "fastq",
            },
          ],
          name: "RR004_water_2_S23A",
          project_id: String(@metadata_validation_project.id),
          status: "created",
        },
      ],
    }, as: :json

    assert_response :success
    assert_equal 1, @response.parsed_body["errors"].length
    assert_equal SampleUploadErrors.missing_required_metadata(
      { "name" => "RR004_water_2_S23A" },
      ["nucleotide_type", "sample_type"]
    ), @response.parsed_body["errors"][0]

    assert_equal 0, Sample.where(name: "RR004_water_2_S23A").length
  end

  # If the metadata field isn't supported by the sample's host genome, throw an error.
  test 'bulk upload invalid key for host genome' do
    sign_in @user

    post bulk_upload_with_metadata_samples_url, params: {
      client: "web",
      metadata: {
        "RR004_water_2_S23A" => {
          'sex' => 'Female',
          'age' => 100,
          'admission_date' => '2018-01',
          'sample_type' => 'blood',
          'nucleotide_type' => 'DNA',
          'blood_fed' => 'Yes',
        },
      },
      samples: [
        {
          host_genome_id: @host_genome_human.id,
          input_files_attributes: [
            {
              name: "RR004_water_2_S23D_R1_001.fastq",
              source: "s3://idseq-samples-test/markazhang/RR004_water_2_S23D_R1_001.fastq",
              source_type: "s3",
              upload_client: "web",
              file_type: "fastq",
            },
            {
              name: "RR004_water_2_S23D_R2_001.fastq",
              source: "s3://idseq-samples-test/markazhang/RR004_water_2_S23D_R2_001.fastq",
              source_type: "s3",
              upload_client: "web",
              file_type: "fastq",
            },
          ],
          name: "RR004_water_2_S23A",
          # project_id is currently passed from front-end as a string, so need to test this works.
          project_id: String(@metadata_validation_project.id),
          status: "created",
        },
      ],
    }, as: :json

    assert_response :success
    assert_equal 1, @response.parsed_body["errors"].length
    assert_equal MetadataUploadErrors.save_error('blood_fed', 'Yes'), @response.parsed_body["errors"][0]

    # The sample should still upload, minus the invalid metadata.
    assert_equal 1, Sample.where(name: "RR004_water_2_S23A").length
    sample_id = Sample.where(name: "RR004_water_2_S23A").first.id
    # The invalid metadata should not be uploaded.
    assert_equal 5, Metadatum.where(sample_id: sample_id).length
  end

  test 'bulk upload core and custom fields' do
    sign_in @user

    # Prior to upload, the custom fields shouldn't exist.
    assert_equal 0, MetadataField.where(name: "Custom Field").length
    assert_equal 0, MetadataField.where(name: "Custom Field 2").length

    # Prior to upload, the core field shouldn't be associated with the project.
    assert_not @metadata_validation_project.metadata_fields.include?(@core_field)

    post bulk_upload_with_metadata_samples_url, params: {
      client: @client_version,
      metadata: {
        "RR004_water_2_S23A" => {
          'sample_type' => 'blood',
          'nucleotide_type' => 'DNA',
          'Example Core Field' => 'Value',
          'Custom Field' => 'Value',
          'Custom Field 2' => 'Value',
        },
      },
      samples: [
        {
          host_genome_id: @host_genome_human.id,
          input_files_attributes: [
            {
              parts: "RR004_water_2_S23A_R1_001.fastq",
              source: "RR004_water_2_S23A_R1_001.fastq",
              source_type: "local",
              upload_client: "web",
              file_type: "fastq",
            },
            {
              parts: "RR004_water_2_S23A_R2_001.fastq",
              source: "RR004_water_2_S23A_R2_001.fastq",
              source_type: "local",
              upload_client: "web",
              file_type: "fastq",
            },
          ],
          name: "RR004_water_2_S23A",
          project_id: String(@metadata_validation_project.id),
          status: "created",
        },
      ],
    }, as: :json

    assert_response :success
    assert_equal 0, @response.parsed_body["errors"].length

    assert_equal 1, Sample.where(name: "RR004_water_2_S23A").length
    sample_id = Sample.where(name: "RR004_water_2_S23A").first.id
    assert_equal 5, Metadatum.where(sample_id: sample_id).length

    # Core field should have been added to project.
    assert @metadata_validation_project.metadata_fields.include?(@core_field)

    # Custom fields should be created and added to project and host genome.
    assert_equal 1, MetadataField.where(name: "Custom Field").length
    assert_equal 1, MetadataField.where(name: "Custom Field 2").length
    assert @metadata_validation_project.metadata_fields.pluck(:name).include?("Custom Field")
    assert @metadata_validation_project.metadata_fields.pluck(:name).include?("Custom Field 2")
    assert @host_genome_human.metadata_fields.pluck(:name).include?("Custom Field")
    assert @host_genome_human.metadata_fields.pluck(:name).include?("Custom Field 2")

    post bulk_upload_with_metadata_samples_url, params: {
      client: @client_version,
      metadata: {
        "RR004_water_2_S23B" => {
          'sample_type' => 'blood',
          'nucleotide_type' => 'DNA',
          'Example Core Field' => 'Value',
          'Custom Field' => 'Value',
          'Custom Field 2' => 'Value',
        },
      },
      samples: [
        {
          host_genome_id: @host_genome_human.id,
          input_files_attributes: [
            {
              parts: "RR004_water_2_S23A_R1_001.fastq",
              source: "RR004_water_2_S23A_R1_001.fastq",
              source_type: "local",
              upload_client: "web",
              file_type: "fastq",
            },
            {
              parts: "RR004_water_2_S23A_R2_001.fastq",
              source: "RR004_water_2_S23A_R2_001.fastq",
              source_type: "local",
              upload_client: "web",
              file_type: "fastq",
            },
          ],
          name: "RR004_water_2_S23B",
          project_id: String(@metadata_validation_project.id),
          status: "created",
        },
      ],
    }, as: :json

    assert_response :success
    assert_equal 0, @response.parsed_body["errors"].length

    assert_equal 1, Sample.where(name: "RR004_water_2_S23B").length
    sample_id = Sample.where(name: "RR004_water_2_S23B").first.id
    assert_equal 5, Metadatum.where(sample_id: sample_id).length

    # The previous custom field should be used. No new field should be created.
    assert_equal 1, MetadataField.where(name: "Custom Field").length
    assert_equal 1, MetadataField.where(name: "Custom Field 2").length
  end

  # Test that when samples with different host genomes all need a custom field,
  # only one custom field is created.
  test 'bulk upload custom field on multiple host genomes' do
    sign_in @user

    # Prior to upload, the custom field shouldn't exist.
    assert_equal 0, MetadataField.where(name: "Custom Field").length

    post bulk_upload_with_metadata_samples_url, params: {
      client: @client_version,
      metadata: {
        "Human Sample" => {
          'sample_type' => 'blood',
          'nucleotide_type' => 'DNA',
          'Custom Field' => 'Value',
        },
        "Mosquito Sample" => {
          'sample_type' => 'blood',
          'Custom Field' => 'Value',
        },
      },
      samples: [
        {
          host_genome_id: @host_genome_human.id,
          input_files_attributes: [
            {
              parts: "RR004_water_2_S23A_R1_001.fastq",
              source: "RR004_water_2_S23A_R1_001.fastq",
              source_type: "local",
              upload_client: "web",
              file_type: "fastq",
            },
            {
              parts: "RR004_water_2_S23A_R2_001.fastq",
              source: "RR004_water_2_S23A_R2_001.fastq",
              source_type: "local",
              upload_client: "web",
              file_type: "fastq",
            },
          ],
          name: "Human Sample",
          project_id: String(@metadata_validation_project.id),
          status: "created",
        },
        {
          host_genome_id: @host_genome_mosquito.id,
          input_files_attributes: [
            {
              parts: "RR004_water_2_S23A_R1_001.fastq",
              source: "RR004_water_2_S23A_R1_001.fastq",
              source_type: "local",
              upload_client: "web",
              file_type: "fastq",
            },
            {
              parts: "RR004_water_2_S23A_R2_001.fastq",
              source: "RR004_water_2_S23A_R2_001.fastq",
              source_type: "local",
              upload_client: "web",
              file_type: "fastq",
            },
          ],
          name: "Mosquito Sample",
          project_id: String(@metadata_validation_project.id),
          status: "created",
        },
      ],
    }, as: :json

    assert_response :success
    assert_equal 0, @response.parsed_body["errors"].length

    assert_equal 1, Sample.where(name: "Human Sample").length
    assert_equal 1, Sample.where(name: "Mosquito Sample").length
    human_sample_id = Sample.where(name: "Human Sample").first.id
    assert_equal 3, Metadatum.where(sample_id: human_sample_id).length
    mosquito_sample_id = Sample.where(name: "Mosquito Sample").first.id
    assert_equal 2, Metadatum.where(sample_id: mosquito_sample_id).length

    # Custom field should be created and added to project and host genome.
    # There should be only a single Custom Field, which has been added to both genomes.
    assert_equal 1, MetadataField.where(name: "Custom Field").length
    assert @metadata_validation_project.metadata_fields.pluck(:name).include?("Custom Field")
    assert @host_genome_human.metadata_fields.pluck(:name).include?("Custom Field")
    assert @host_genome_mosquito.metadata_fields.pluck(:name).include?("Custom Field")

    # The new custom field should be added to all host genomes.
    assert_equal MetadataField.where(name: "Custom Field").first.host_genomes.length, HostGenome.all.length
  end

  # Test that a nonadmin user cannot upload to a private project he is not a member of.
  test 'joe cannot bulk upload to a private project' do
    sign_in @user_nonadmin

    post bulk_upload_with_metadata_samples_url, params: {
      client: @client_version,
      metadata: {
        "RR004_water_2_S23A" => {
          'sample_type' => 'blood',
          'nucleotide_type' => 'DNA',
          'Example Core Field' => 'Value',
          'Custom Field' => 'Value',
          'Custom Field 2' => 'Value',
        },
      },
      samples: [
        {
          host_genome_id: @host_genome_human.id,
          input_files_attributes: [
            {
              parts: "RR004_water_2_S23A_R1_001.fastq",
              source: "RR004_water_2_S23A_R1_001.fastq",
              source_type: "local",
              upload_client: "web",
              file_type: "fastq",
            },
            {
              parts: "RR004_water_2_S23A_R2_001.fastq",
              source: "RR004_water_2_S23A_R2_001.fastq",
              source_type: "local",
              upload_client: "web",
              file_type: "fastq",
            },
          ],
          name: "RR004_water_2_S23A",
          project_id: String(@metadata_validation_project.id),
          status: "created",
        },
      ],
    }, as: :json

    assert_response :success
    assert_equal 1, @response.parsed_body["errors"].length
    assert_equal SampleUploadErrors.invalid_project_id("name" => "RR004_water_2_S23A"), @response.parsed_body["errors"][0]

    assert_equal 0, Sample.where(name: "RR004_water_2_S23A").length
  end

  # Test that a nonadmin user cannot upload to a public project
  test 'joe cannot bulk upload to a public project' do
    sign_in @user_nonadmin

    post bulk_upload_with_metadata_samples_url, params: {
      client: @client_version,
      metadata: {
        "RR004_water_2_S23A" => {
          'sample_type' => 'blood',
          'nucleotide_type' => 'DNA',
          'Example Core Field' => 'Value',
          'Custom Field' => 'Value',
          'Custom Field 2' => 'Value',
        },
      },
      samples: [
        {
          host_genome_id: @host_genome_human.id,
          input_files_attributes: [
            {
              parts: "RR004_water_2_S23A_R1_001.fastq",
              source: "RR004_water_2_S23A_R1_001.fastq",
              source_type: "local",
              upload_client: "web",
              file_type: "fastq",
            },
            {
              parts: "RR004_water_2_S23A_R2_001.fastq",
              source: "RR004_water_2_S23A_R2_001.fastq",
              source_type: "local",
              upload_client: "web",
              file_type: "fastq",
            },
          ],
          name: "RR004_water_2_S23A",
          project_id: String(@public_project.id),
          status: "created",
        },
      ],
    }, as: :json

    assert_response :success
    assert_equal 1, @response.parsed_body["errors"].length
    assert_equal SampleUploadErrors.invalid_project_id("name" => "RR004_water_2_S23A"), @response.parsed_body["errors"][0]

    assert_equal 0, Sample.where(name: "RR004_water_2_S23A").length
  end

  # Test that a nonadmin user can upload to a project he is a member of.
  test 'joe can bulk upload to projects he is a member of' do
    sign_in @user_nonadmin

    post bulk_upload_with_metadata_samples_url, params: {
      client: @client_version,
      metadata: {
        "RR004_water_2_S23A" => {
          'sample_type' => 'blood',
          'nucleotide_type' => 'DNA',
          'Example Core Field' => 'Value',
          'Custom Field' => 'Value',
          'Custom Field 2' => 'Value',
        },
      },
      samples: [
        {
          host_genome_id: @host_genome_human.id,
          input_files_attributes: [
            {
              parts: "RR004_water_2_S23A_R1_001.fastq",
              source: "RR004_water_2_S23A_R1_001.fastq",
              source_type: "local",
              upload_client: "web",
              file_type: "fastq",
            },
            {
              parts: "RR004_water_2_S23A_R2_001.fastq",
              source: "RR004_water_2_S23A_R2_001.fastq",
              source_type: "local",
              upload_client: "web",
              file_type: "fastq",
            },
          ],
          name: "RR004_water_2_S23A",
          project_id: String(@joe_project.id),
          status: "created",
        },
      ],
    }, as: :json

    assert_response :success
    assert_equal 0, @response.parsed_body["errors"].length
  end
end
