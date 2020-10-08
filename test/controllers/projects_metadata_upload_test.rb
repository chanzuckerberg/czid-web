require 'test_helper'

# Tests ProjectsController upload_metadata endpoint
class ProjectsMetadataUploadTest < ActionDispatch::IntegrationTest
  include ErrorHelper

  setup do
    @project = projects(:one)
    @public_project = projects(:public_project)
    @joe_project = projects(:joe_project)
    @metadata_validation_project = projects(:metadata_validation_project)
    @metadata_validation_sample_human = samples(:metadata_validation_sample_human)
    @metadata_validation_sample_mosquito = samples(:metadata_validation_sample_mosquito)
    @joe_project_sample_a = samples(:joe_project_sampleA)
    @user = users(:admin_one)
    @core_field = metadata_fields(:core_field)
    @host_genome_human = host_genomes(:human)
    @host_genome_mosquito = host_genomes(:mosquito)
    @user_nonadmin = users(:joe)
  end

  test 'metadata upload basic' do
    sign_in @user

    post upload_metadata_project_url(@metadata_validation_project), params: {
      metadata: {
        'metadata_validation_sample_human' => {
          'sex' => 'Female',
          'age' => 100,
          'admission_date' => '2018-01',
        },
      },
    }, as: :json

    assert_response :success

    assert_equal 0, @response.parsed_body['errors'].length

    assert_equal 3, Metadatum.where(sample_id: @metadata_validation_sample_human.id).length
  end

  test 'metadata upload invalid sample name' do
    sign_in @user

    assert_no_difference('Metadatum.where(sample_id: @metadata_validation_sample_human.id).length') do
      post upload_metadata_project_url(@metadata_validation_project), params: {
        metadata: {
          'foobar' => {
            'sex' => 'Female',
            'age' => 100,
            'admission_date' => '2018-01',
          },
        },
      }, as: :json
    end

    assert_response :success

    assert_equal 1, @response.parsed_body['errors'].length
    assert_match MetadataUploadErrors.invalid_sample_name('foobar'), @response.parsed_body['errors'][0]
  end

  test 'metadata upload invalid values' do
    sign_in @user

    assert_no_difference('Metadatum.where(sample_id: @metadata_validation_sample_human.id).length') do
      post upload_metadata_project_url(@metadata_validation_project), params: {
        metadata: {
          'metadata_validation_sample_human' => {
            'sex' => 'foobar',
            'age' => 'foobar',
            'admission_date' => 'foobar',
          },
        },
      }, as: :json
    end

    assert_response :success

    assert_equal 3, @response.parsed_body['errors'].length
    assert_match MetadataUploadErrors.save_error('sex', 'foobar'), @response.parsed_body['errors'][0]
    assert_match MetadataUploadErrors.save_error('age', 'foobar'), @response.parsed_body['errors'][1]
    assert_match MetadataUploadErrors.save_error('admission_date', 'foobar'), @response.parsed_body['errors'][2]
  end

  # If the metadata field isn't supported by the sample's host genome, throw an error.
  test 'metadata upload invalid key for host genome' do
    sign_in @user

    assert_no_difference('Metadatum.where(sample_id: @metadata_validation_sample_human.id).length') do
      post upload_metadata_project_url(@metadata_validation_project), params: {
        metadata: {
          'metadata_validation_sample_human' => {
            'blood_fed' => 'Yes',
          },
        },
      }, as: :json
    end

    assert_response :success

    assert_equal 1, @response.parsed_body['errors'].length
    assert_match MetadataUploadErrors.save_error('blood_fed', 'Yes'), @response.parsed_body['errors'][0]
  end

  test 'metadata upload core and custom fields' do
    sign_in @user

    # Prior to upload, the custom fields shouldn't exist.
    assert_equal 0, MetadataField.where(name: "Custom Field").length
    assert_equal 0, MetadataField.where(name: "Custom Field 2").length

    # Prior to upload, the core field shouldn't be associated with the project.
    assert_not @metadata_validation_project.metadata_fields.include?(@core_field)

    post upload_metadata_project_url(@metadata_validation_project), params: {
      metadata: {
        'metadata_validation_sample_human' => {
          'sex' => 'Female',
          'age' => 100,
          'admission_date' => '2018-01',
          'Example Core Field' => 'Value',
          'Custom Field' => 'Value',
          'Custom Field 2' => 'Value',
        },
      },
    }, as: :json

    assert_response :success
    assert @metadata_validation_project.metadata_fields.include?(@core_field)

    puts(@response.parsed_body['errors'])
    assert_equal 0, @response.parsed_body['errors'].length

    assert_equal 6, Metadatum.where(sample_id: @metadata_validation_sample_human.id).length

    # Custom fields should be created and added to project and host genome.
    assert_equal 1, MetadataField.where(name: "Custom Field").length
    assert_equal 1, MetadataField.where(name: "Custom Field 2").length
    assert @metadata_validation_project.metadata_fields.pluck(:name).include?("Custom Field")
    assert @metadata_validation_project.metadata_fields.pluck(:name).include?("Custom Field 2")
    assert @host_genome_human.metadata_fields.pluck(:name).include?("Custom Field")
    assert @host_genome_human.metadata_fields.pluck(:name).include?("Custom Field 2")
  end

  # When samples with different host genomes all upload the same custom field,
  # only one custom field is created.
  test 'metadata upload custom field on multiple host genomes' do
    sign_in @user

    # Prior to upload, the custom field shouldn't exist.
    assert_equal 0, MetadataField.where(name: "Custom Field").length

    post upload_metadata_project_url(@metadata_validation_project), params: {
      metadata: {
        'metadata_validation_sample_human' => {
          'Custom Field' => 'Value',
        },
        'metadata_validation_sample_mosquito' => {
          'Custom Field' => 'Value',
        },
      },
    }, as: :json

    assert_response :success

    assert_equal 0, @response.parsed_body['errors'].length

    assert_equal 1, Metadatum.where(sample_id: @metadata_validation_sample_human.id).length
    assert_equal 1, Metadatum.where(sample_id: @metadata_validation_sample_mosquito.id).length

    # Custom field should be created and added to project and host genome.
    # There should be only a single Custom Field, which has been added to both genomes.
    assert_equal 1, MetadataField.where(name: "Custom Field").length
    assert @metadata_validation_project.metadata_fields.pluck(:name).include?("Custom Field")
    assert @host_genome_human.metadata_fields.pluck(:name).include?("Custom Field")
    assert @host_genome_mosquito.metadata_fields.pluck(:name).include?("Custom Field")

    # The new custom field should be added to all host genomes.
    assert_equal MetadataField.where(name: "Custom Field").first.host_genomes.length, HostGenome.all.length
  end

  test 'joe cannot upload metadata to a public project' do
    sign_in @user_nonadmin

    assert_raises(ActiveRecord::RecordNotFound) do
      post upload_metadata_project_url(@public_project), params: {
        metadata: {
          'metadata_validation_sample_human' => {
            'sex' => 'Female',
            'age' => 100,
            'admission_date' => '2018-01',
          },
        },
      }, as: :json
    end
  end

  test 'joe cannot upload metadata to another private project' do
    sign_in @user_nonadmin

    assert_raises(ActiveRecord::RecordNotFound) do
      post upload_metadata_project_url(@metadata_validation_project), params: {
        metadata: {
          'metadata_validation_sample_human' => {
            'sex' => 'Female',
            'age' => 100,
            'admission_date' => '2018-01',
          },
        },
      }, as: :json
    end
  end

  test 'joe can upload metadata to a private project he is a member of' do
    sign_in @user_nonadmin

    post upload_metadata_project_url(@joe_project), params: {
      metadata: {
        'joe_project_sampleA' => {
          'sex' => 'Female',
          'age' => 100,
          'admission_date' => '2018-01',
        },
      },
    }, as: :json

    assert_response :success

    assert_equal 0, @response.parsed_body['errors'].length
    assert_equal 4, Metadatum.where(sample_id: @joe_project_sample_a.id).length
  end
end
