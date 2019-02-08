require 'test_helper'

# Tests ProjectsController upload_metadata endpoint
class ProjectsMetadataUploadTest < ActionDispatch::IntegrationTest
  setup do
    @project = projects(:one)
    @metadata_validation_project = projects(:metadata_validation_project)
    @metadata_validation_sample_human = samples(:metadata_validation_sample_human)
    @deletable_project = projects(:deletable_project)
    @user = users(:one)
    @user_params = { 'user[email]' => @user.email, 'user[password]' => 'password' }
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
end
