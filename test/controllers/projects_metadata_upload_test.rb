require 'test_helper'

# Tests ProjectsController upload_metadata endpoint
class ProjectsMetadataUploadTest < ActionDispatch::IntegrationTest
  include ErrorHelper

  setup do
    @project = projects(:one)
    @metadata_validation_project = projects(:metadata_validation_project)
    @metadata_validation_sample_human = samples(:metadata_validation_sample_human)
    @deletable_project = projects(:deletable_project)
    @user = users(:one)
    @core_field = metadata_fields(:core_field)
    @user_params = { 'user[email]' => @user.email, 'user[password]' => 'password' }
    @host_genome_human = host_genomes(:human)
  end

  test 'metadata upload basic' do
    post user_session_path, params: @user_params

    post upload_metadata_project_url(@metadata_validation_project), params: {
      metadata: {
        'metadata_validation_sample_human' => {
          'sex' => 'Female',
          'age' => 100,
          'admission_date' => '2018-01-01'
        }
      }
    }, as: :json

    assert_response :success

    assert_equal 0, @response.parsed_body['errors'].length

    assert_equal 3, Metadatum.where(sample_id: @metadata_validation_sample_human.id).length
  end

  test 'metadata upload invalid sample name' do
    post user_session_path, params: @user_params

    assert_no_difference('Metadatum.where(sample_id: @metadata_validation_sample_human.id).length') do
      post upload_metadata_project_url(@metadata_validation_project), params: {
        metadata: {
          'foobar' => {
            'sex' => 'Female',
            'age' => 100,
            'admission_date' => '2018-01-01'
          }
        }
      }, as: :json
    end

    assert_response :success

    assert_equal 1, @response.parsed_body['errors'].length
    assert_match MetadataUploadErrors.invalid_sample_name('foobar'), @response.parsed_body['errors'][0]
  end

  test 'metadata upload invalid values' do
    post user_session_path, params: @user_params

    assert_no_difference('Metadatum.where(sample_id: @metadata_validation_sample_human.id).length') do
      post upload_metadata_project_url(@metadata_validation_project), params: {
        metadata: {
          'metadata_validation_sample_human' => {
            'sex' => 'foobar',
            'age' => 'foobar',
            'admission_date' => 'foobar'
          }
        }
      }, as: :json
    end

    assert_response :success

    assert_equal 3, @response.parsed_body['errors'].length
    assert_match MetadataUploadErrors.save_error('sex', 'foobar'), @response.parsed_body['errors'][0]
    assert_match MetadataUploadErrors.save_error('age', 'foobar'), @response.parsed_body['errors'][1]
    assert_match MetadataUploadErrors.save_error('admission_date', 'foobar'), @response.parsed_body['errors'][2]
  end

  test 'metadata upload core and custom fields' do
    post user_session_path, params: @user_params

    # Prior to upload, the custom fields shouldn't exist.
    assert_equal 0, MetadataField.where(name: "Custom Field").length
    assert_equal 0, MetadataField.where(name: "Custom Field 2").length

    # Prior to upload, the core field shouldn't be associated with the project.
    assert !@metadata_validation_project.metadata_fields.include?(@core_field)

    post upload_metadata_project_url(@metadata_validation_project), params: {
      metadata: {
        'metadata_validation_sample_human' => {
          'sex' => 'Female',
          'age' => 100,
          'admission_date' => '2018-01-01',
          'Example Core Field' => 'Value',
          'Custom Field' => 'Value',
          'Custom Field 2' => 'Value'
        }
      }
    }, as: :json

    assert_response :success
    assert @metadata_validation_project.metadata_fields.include?(@core_field)

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
end
