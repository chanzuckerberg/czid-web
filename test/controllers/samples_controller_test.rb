require 'test_helper'

class SamplesControllerTest < ActionDispatch::IntegrationTest
  setup do
    @sample = samples(:one)
    @project = projects(:one)
    @user = users(:one)
    @user.authentication_token = 'sdfsdfsdff'
    @user.save
  end

  test 'should get index' do
    get samples_url
    assert_response :success
  end

  test 'should get new' do
    get new_sample_url
    assert_response :success
  end

  test 'should create sample' do
    req_headers = { 'X-User-Email' => @user.email,
                    'X-User-Token' => @user.authentication_token }
    input_files = [{ source: "RR004_water_2_S23_R1_001.fastq.gz",
                     name: "RR004_water_2_S23_R1_001.fastq.gz",
                     source_type: "local" },
                    { source: "RR004_water_2_S23_R2_001.fastq.gz",
                      name: "RR004_water_2_S23_R2_001.fastq.gz",
                      source_type: "local" }]
    assert_difference('Sample.count') do
      post samples_url, params: { sample: { name: 'new sample', project_name: @project.name, input_files_attributes: input_files } }, headers: req_headers
    end

    assert_redirected_to sample_url(Sample.last)
  end

  test 'should show sample' do
    get sample_url(@sample)
    assert_response :success
  end

  test 'should get edit' do
    get edit_sample_url(@sample)
    assert_response :success
  end

  test 'should update sample' do
    assert @sample.valid?
    patch sample_url(@sample), params: { sample: { name: @sample.name + ' asdf' } }
    assert_redirected_to sample_url(@sample)
  end

  test 'should destroy sample' do
    assert_difference('Sample.count', -1) do
      delete sample_url(@sample)
    end

    assert_redirected_to samples_url
  end
end
