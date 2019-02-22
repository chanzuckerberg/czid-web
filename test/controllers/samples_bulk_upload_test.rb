require 'test_helper'
require 'constants/errors'

# Tests SamplesController bulk_upload_with_metadata
class SamplesBulkUploadTest < ActionDispatch::IntegrationTest
  setup do
    @metadata_validation_project = projects(:metadata_validation_project)
    @user = users(:one)
    @host_genome_human = host_genomes(:human)
    @core_field = metadata_fields(:core_field)
    @user_params = { 'user[email]' => @user.email, 'user[password]' => 'password' }
  end

  test 'bulk upload basic remote' do
    post user_session_path, params: @user_params

    post bulk_upload_with_metadata_samples_url, params: {
      client: "web",
      metadata: {
        "RR004_water_2_S23A" => {
          'sex' => 'Female',
          'age' => 100,
          'admission_date' => '2018-01-01',
          'sample_type' => 'blood',
          'nucleotide_type' => 'DNA'
        },
        "RR004_water_2_S23B" => {
          'sex' => 'Male',
          'age' => 50,
          'sample_type' => 'CSF',
          'nucleotide_type' => 'RNA'
        }
      },
      samples: [
        {
          host_genome_id: @host_genome_human.id,
          input_files_attributes: [
            {
              name: "RR004_water_2_S23D_R1_001.fastq",
              source: "s3://idseq-samples-test/markazhang/RR004_water_2_S23D_R1_001.fastq",
              source_type: "s3"
            },
            {
              name: "RR004_water_2_S23D_R2_001.fastq",
              source: "s3://idseq-samples-test/markazhang/RR004_water_2_S23D_R2_001.fastq",
              source_type: "s3"
            }
          ],
          name: "RR004_water_2_S23A",
          # project_id is currently passed from front-end as a string, so need to test this works.
          project_id: String(@metadata_validation_project.id),
          status: "created"
        },
        {
          host_genome_id: @host_genome_human.id,
          input_files_attributes: [
            {
              name: "RR004_water_2_S23D_R1_001.fastq",
              source: "s3://idseq-samples-test/markazhang/RR004_water_2_S23D_R1_001.fastq",
              source_type: "s3"
            },
            {
              name: "RR004_water_2_S23D_R2_001.fastq",
              source: "s3://idseq-samples-test/markazhang/RR004_water_2_S23D_R2_001.fastq",
              source_type: "s3"
            }
          ],
          name: "RR004_water_2_S23B",
          # project_id is currently passed from front-end as a string, so need to test this works.
          project_id: String(@metadata_validation_project.id),
          status: "created"
        }
      ]
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
    post user_session_path, params: @user_params

    post bulk_upload_with_metadata_samples_url, params: {
      client: "web",
      metadata: {
        "RR004_water_2_S23A" => {
          'sex' => 'Female',
          'age' => 100,
          'admission_date' => '2018-01-01',
          'sample_type' => 'blood',
          'nucleotide_type' => 'DNA'
        },
        "RR004_water_2_S23B" => {
          'sex' => 'Male',
          'age' => 50,
          'sample_type' => 'CSF',
          'nucleotide_type' => 'RNA'
        }
      },
      samples: [
        {
          host_genome_id: @host_genome_human.id,
          input_files_attributes: [
            {
              parts: "RR004_water_2_S23A_R1_001.fastq",
              source: "RR004_water_2_S23A_R1_001.fastq",
              source_type: "local"
            },
            {
              parts: "RR004_water_2_S23A_R2_001.fastq",
              source: "RR004_water_2_S23A_R2_001.fastq",
              source_type: "local"
            }
          ],
          name: "RR004_water_2_S23A",
          project_id: String(@metadata_validation_project.id),
          status: "created"
        },
        {
          host_genome_id: @host_genome_human.id,
          input_files_attributes: [
            {
              parts: "RR004_water_2_S23B_R1_001.fastq",
              source: "RR004_water_2_S23B_R1_001.fastq",
              source_type: "local"
            },
            {
              parts: "RR004_water_2_S23B_R2_001.fastq",
              source: "RR004_water_2_S23B_R2_001.fastq",
              source_type: "local"
            }
          ],
          name: "RR004_water_2_S23B",
          project_id: String(@metadata_validation_project.id),
          status: "created"
        }
      ]
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

  test 'bulk upload old client' do
    post user_session_path, params: @user_params

    post bulk_upload_with_metadata_samples_url, params: {
      client: "0.4.0",
      metadata: {
        "RR004_water_2_S23A" => {
          'sex' => 'Female',
          'age' => 100,
          'admission_date' => '2018-01-01',
          'sample_type' => 'blood',
          'nucleotide_type' => 'DNA'
        }
      },
      samples: [
        {
          host_genome_id: @host_genome_human.id,
          input_files_attributes: [
            {
              parts: "RR004_water_2_S23A_R1_001.fastq",
              source: "RR004_water_2_S23A_R1_001.fastq",
              source_type: "local"
            },
            {
              parts: "RR004_water_2_S23A_R2_001.fastq",
              source: "RR004_water_2_S23A_R2_001.fastq",
              source_type: "local"
            }
          ],
          name: "RR004_water_2_S23A",
          project_id: String(@metadata_validation_project.id),
          status: "created"
        }
      ]
    }, as: :json

    assert_response :success
    assert_equal "upgrade_required", @response.parsed_body["status"]
  end

  test 'bulk upload new client' do
    post user_session_path, params: @user_params

    post bulk_upload_with_metadata_samples_url, params: {
      client: "0.5.0",
      metadata: {
        "RR004_water_2_S23A" => {
          'sex' => 'Female',
          'age' => 100,
          'admission_date' => '2018-01-01',
          'sample_type' => 'blood',
          'nucleotide_type' => 'DNA'
        }
      },
      samples: [
        {
          host_genome_id: @host_genome_human.id,
          input_files_attributes: [
            {
              parts: "RR004_water_2_S23A_R1_001.fastq",
              source: "RR004_water_2_S23A_R1_001.fastq",
              source_type: "local"
            },
            {
              parts: "RR004_water_2_S23A_R2_001.fastq",
              source: "RR004_water_2_S23A_R2_001.fastq",
              source_type: "local"
            }
          ],
          name: "RR004_water_2_S23A",
          project_id: String(@metadata_validation_project.id),
          status: "created"
        }
      ]
    }, as: :json

    assert_response :success
    assert_equal 0, @response.parsed_body["errors"].length

    assert_equal 1, Sample.where(name: "RR004_water_2_S23A").length
    sample_id = Sample.where(name: "RR004_water_2_S23A").first.id
    assert_equal 5, Metadatum.where(sample_id: sample_id).length
  end

  test 'bulk upload missing required metadata' do
    post user_session_path, params: @user_params

    post bulk_upload_with_metadata_samples_url, params: {
      client: "0.5.0",
      metadata: {
        "RR004_water_2_S23A" => {
          'sex' => 'Female',
          'age' => 100,
          'admission_date' => '2018-01-01'
        }
      },
      samples: [
        {
          host_genome_id: @host_genome_human.id,
          input_files_attributes: [
            {
              parts: "RR004_water_2_S23A_R1_001.fastq",
              source: "RR004_water_2_S23A_R1_001.fastq",
              source_type: "local"
            },
            {
              parts: "RR004_water_2_S23A_R2_001.fastq",
              source: "RR004_water_2_S23A_R2_001.fastq",
              source_type: "local"
            }
          ],
          name: "RR004_water_2_S23A",
          project_id: String(@metadata_validation_project.id),
          status: "created"
        }
      ]
    }, as: :json

    assert_response :success
    assert_equal 1, @response.parsed_body["errors"].length
    assert_equal SampleUploadErrors.missing_required_metadata(
      { "name" => "RR004_water_2_S23A" },
      ["nucleotide_type", "sample_type"]
    ), @response.parsed_body["errors"][0]

    assert_equal 0, Sample.where(name: "RR004_water_2_S23A").length
  end

  test 'bulk upload core and custom fields' do
    post user_session_path, params: @user_params

    # Prior to upload, the custom fields shouldn't exist.
    assert_equal 0, MetadataField.where(name: "Custom Field").length
    assert_equal 0, MetadataField.where(name: "Custom Field 2").length

    # Prior to upload, the core field shouldn't be associated with the project.
    assert !@metadata_validation_project.metadata_fields.include?(@core_field)

    post bulk_upload_with_metadata_samples_url, params: {
      client: "0.5.0",
      metadata: {
        "RR004_water_2_S23A" => {
          'sample_type' => 'blood',
          'nucleotide_type' => 'DNA',
          'Example Core Field' => 'Value',
          'Custom Field' => 'Value',
          'Custom Field 2' => 'Value'
        }
      },
      samples: [
        {
          host_genome_id: @host_genome_human.id,
          input_files_attributes: [
            {
              parts: "RR004_water_2_S23A_R1_001.fastq",
              source: "RR004_water_2_S23A_R1_001.fastq",
              source_type: "local"
            },
            {
              parts: "RR004_water_2_S23A_R2_001.fastq",
              source: "RR004_water_2_S23A_R2_001.fastq",
              source_type: "local"
            }
          ],
          name: "RR004_water_2_S23A",
          project_id: String(@metadata_validation_project.id),
          status: "created"
        }
      ]
    }, as: :json

    assert_response :success
    assert @metadata_validation_project.metadata_fields.include?(@core_field)
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
      client: "0.5.0",
      metadata: {
        "RR004_water_2_S23B" => {
          'sample_type' => 'blood',
          'nucleotide_type' => 'DNA',
          'Example Core Field' => 'Value',
          'Custom Field' => 'Value',
          'Custom Field 2' => 'Value'
        }
      },
      samples: [
        {
          host_genome_id: @host_genome_human.id,
          input_files_attributes: [
            {
              parts: "RR004_water_2_S23A_R1_001.fastq",
              source: "RR004_water_2_S23A_R1_001.fastq",
              source_type: "local"
            },
            {
              parts: "RR004_water_2_S23A_R2_001.fastq",
              source: "RR004_water_2_S23A_R2_001.fastq",
              source_type: "local"
            }
          ],
          name: "RR004_water_2_S23B",
          project_id: String(@metadata_validation_project.id),
          status: "created"
        }
      ]
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

  # TODO(mark): Test for sample with invalid project id.
  # Since this endpoint is currently admin-only and admins can access all projects, it's hard to test this right now.
end
