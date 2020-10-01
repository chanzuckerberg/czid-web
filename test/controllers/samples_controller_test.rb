require 'test_helper'

class SamplesControllerTest < ActionDispatch::IntegrationTest
  include ActiveSupport::Testing::TimeHelpers

  setup do
    @background = backgrounds(:real_background)
    @sample = samples(:one)
    @sample_human_existing_metadata_public = samples(:sample_human_existing_metadata_public)
    @metadata_validation_sample_human_existing_metadata = samples(:metadata_validation_sample_human_existing_metadata)
    @sample_human_existing_metadata_joe_project = samples(:sample_human_existing_metadata_joe_project)
    @sample_human_existing_metadata_expired = samples(:sample_human_existing_metadata_expired)
    @deletable_sample = samples(:deletable_sample)
    @project = projects(:one)
    @user = users(:admin_one)
    @user.authentication_token = 'sdfsdfsdff'
    @user.save
    @user_nonadmin = users(:joe)
  end

  test 'should get index' do
    sign_in @user
    get samples_url
    assert_response :success
  end

  test 'pipeline_runs' do
    get pipeline_runs_sample_url(@sample)
    assert :success
  end

  test 'reupload source' do
    sign_in @user
    put reupload_source_sample_url(@sample)
    assert :success
  end

  test 'reupload source 2' do
    put reupload_source_sample_url(@sample)
    assert_redirected_to new_user_session_url
  end

  test 'kick off pipeline' do
    sign_in @user
    put kickoff_pipeline_sample_url(@sample)
    assert :success
  end

  test 'kick off pipeline without authentication' do
    put kickoff_pipeline_sample_url(@sample)
    assert_redirected_to new_user_session_url
  end

  test 'should create sample through web' do
    skip("This endpoint is deprecated in favor of upload with metadata")

    sign_in @user
    input_files = [{ source: "RR004_water_2_S23_R1_001.fastq.gz",
                     name: "RR004_water_2_S23_R1_001.fastq.gz",
                     source_type: "local", },
                   { source: "RR004_water_2_S23_R2_001.fastq.gz",
                     name: "RR004_water_2_S23_R2_001.fastq.gz",
                     source_type: "local", },]
    assert_difference('Sample.count') do
      post samples_url, params: { sample: { name: 'new sample', project_name: @project.name, client: "web", input_files_attributes: input_files } }
    end
    assert_redirected_to sample_url(Sample.last)
  end

  test 'should show sample' do
    sign_in @user
    get sample_url(@sample)
    assert_response :success
  end

  test 'should get edit' do
    sign_in @user
    get edit_sample_url(@sample)
    assert_response :success
  end

  test 'should update sample' do
    sign_in @user
    assert @sample.valid?
    patch sample_url(@sample, format: "json"), params: { sample: { name: @sample.name + ' asdf' } }
    assert_response :success
  end

  test 'should destroy sample' do
    sign_in @user
    assert_difference('Sample.count', -1) do
      delete sample_url(@deletable_sample)
    end
    assert_redirected_to samples_url
  end

  test 'joe can fetch metadata for a public sample' do
    sign_in @user_nonadmin

    get metadata_sample_url(@sample_human_existing_metadata_public)
    assert_response :success

    assert_equal ["nucleotide_type", "sex"], @response.parsed_body['metadata'].pluck("key")
  end

  test 'joe can fetch metadata for an expired sample' do
    sign_in @user_nonadmin

    get metadata_sample_url(@sample_human_existing_metadata_expired)
    assert_response :success

    assert_equal ["age", "sex"], @response.parsed_body['metadata'].pluck("key")
  end

  test 'joe can fetch metadata for his own private samples' do
    sign_in @user_nonadmin

    get metadata_sample_url(@sample_human_existing_metadata_joe_project)
    assert_response :success

    assert_equal ["sample_type", "sex"], @response.parsed_body['metadata'].pluck("key")
  end

  # non-admin user should not be able to query another user's private sample.
  test 'joe cannot fetch metadata for another user\'s private samples' do
    sign_in @user_nonadmin

    get metadata_sample_url(@metadata_validation_sample_human_existing_metadata)
    assert_response :not_found
  end

  test 'joe can fetch the metadata fields for a public sample' do
    sign_in @user_nonadmin

    get metadata_fields_samples_url, params: {
      sampleIds: [@sample_human_existing_metadata_public.id],
    }
    assert_response :success

    assert_equal ["Nucleotide Type", "Sample Type"], @response.parsed_body.pluck("name")
  end

  test 'joe can fetch the metadata fields for an expired sample' do
    sign_in @user_nonadmin

    get metadata_fields_samples_url, params: {
      sampleIds: [@sample_human_existing_metadata_expired.id],
    }
    assert_response :success

    assert_equal ["Age"], @response.parsed_body.pluck("name")
  end

  test 'joe can fetch the metadata fields for his own private sample' do
    sign_in @user_nonadmin

    get metadata_fields_samples_url, params: {
      sampleIds: [@sample_human_existing_metadata_joe_project.id],
    }
    assert_response :success

    assert_equal ["Nucleotide Type", "Age", "Sex", "Sample Type", "Admission Date"], @response.parsed_body.pluck("name")
  end

  test 'joe cannot fetch the metadata fields for another user\'s private sample' do
    sign_in @user_nonadmin

    assert_raises(ActiveRecord::RecordNotFound) do
      get metadata_fields_samples_url, params: {
        sampleIds: [@metadata_validation_sample_human_existing_metadata.id],
      }
    end
  end

  # If multiple samples, merge the fields.
  test 'joe can fetch the metadata fields for multiple samples' do
    sign_in @user_nonadmin

    get metadata_fields_samples_url, params: {
      sampleIds: [@sample_human_existing_metadata_public.id, @sample_human_existing_metadata_expired.id],
    }
    assert_response :success

    assert_equal ["Age", "Nucleotide Type", "Sample Type"], @response.parsed_body.pluck("name")
  end

  # If multiple samples but one is invalid, return fields for the valid ones.
  test 'joe can fetch the metadata fields for multiple samples, and invalid ones will be omitted' do
    sign_in @user_nonadmin

    get metadata_fields_samples_url, params: {
      sampleIds: [@sample_human_existing_metadata_public.id, @metadata_validation_sample_human_existing_metadata.id],
    }
    assert_response :success

    assert_equal ["Nucleotide Type", "Sample Type"], @response.parsed_body.pluck("name")
  end

  test 'joe cannot save metadata to a public sample' do
    sign_in @user_nonadmin

    post save_metadata_v2_sample_url(@sample_human_existing_metadata_public), params: {
      field: "sample_type",
      value: "Foobar Sample Type",
    }
    assert_response :not_found
  end

  test 'joe cannot save metadata to an expired sample' do
    sign_in @user_nonadmin

    post save_metadata_v2_sample_url(@sample_human_existing_metadata_expired), params: {
      field: "sample_type",
      value: "Foobar Sample Type",
    }
    assert_response :not_found
  end

  test 'joe can save metadata to his own private sample' do
    sign_in @user_nonadmin

    post save_metadata_v2_sample_url(@sample_human_existing_metadata_joe_project), params: {
      field: "sample_type",
      value: "Foobar Sample Type",
    }

    assert_response :success

    assert_equal "Foobar Sample Type", @sample_human_existing_metadata_joe_project.metadata.find_by(key: "sample_type").raw_value
  end

  test 'joe cannot save metadata to another user\'s private sample' do
    sign_in @user_nonadmin

    post save_metadata_v2_sample_url(@metadata_validation_sample_human_existing_metadata), params: {
      field: "sample_type",
      value: "Foobar Sample Type",
    }
    assert_response :not_found
  end
end
