require 'test_helper'

# Tests SamplesController bulk_upload_with_metadata
class SamplesBulkUploadTest < ActionDispatch::IntegrationTest
  setup do
    @metadata_validation_project = projects(:metadata_validation_project)
    @user = users(:one)
    @host_genome_human = host_genomes(:human)
    @user_params = { 'user[email]' => @user.email, 'user[password]' => 'password' }
  end

  test 'bulk upload basic' do
    post user_session_path, params: @user_params

    post bulk_upload_with_metadata_samples_url, params: {
      metadata: {
        'RR004_water_2_S23D_R1_001' => {
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
          name: "RR004_water_2_S23D_R1_001",
          # project_id is currently passed from front-end as a string, so need to test this works.
          project_id: String(@metadata_validation_project.id),
          status: "created"
        }
      ]
    }, as: :json

    assert_response :success

    assert_equal 1, Sample.where(name: "RR004_water_2_S23D_R1_001").length
    sample_id = Sample.where(name: "RR004_water_2_S23D_R1_001").first.id
    assert_equal 3, Metadatum.where(sample_id: sample_id).length
  end
end
