require 'test_helper'

# Tests SamplesController create_with_metadata
class SamplesCreateTest < ActionDispatch::IntegrationTest
  setup do
    @metadata_validation_project = projects(:metadata_validation_project)
    @user = users(:one)
    @host_genome_human = host_genomes(:human)
    @user_params = { 'user[email]' => @user.email, 'user[password]' => 'password' }
  end

  test 'create with metadata basic' do
    post user_session_path, params: @user_params

    post create_with_metadata_samples_url, params: {
      metadata: {
        'sex' => 'Female',
        'age' => 100,
        'admission_date' => '2018-01-01'
      },
      sample: {
        client: "web",
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
        project_name: @metadata_validation_project.name,
        status: "created"
      }
    }, as: :json

    assert_response :success

    assert_equal 1, Sample.where(name: "RR004_water_2_S23A").length
    sample_id = Sample.where(name: "RR004_water_2_S23A").first.id
    assert_equal 3, Metadatum.where(sample_id: sample_id).length
  end
end
