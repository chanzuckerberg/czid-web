require 'test_helper'

class SamplesControllerTest < ActionDispatch::IntegrationTest
  setup do
    @sample = samples(:one)
    @project = projects(:one)
    @user = users(:one)
    @user.authentication_token = "sdfsdfsdff"
    @user.save
  end

  test "should get index" do
    get samples_url
    assert_response :success
  end

  test "should get new" do
    get new_sample_url
    assert_response :success
  end

  test "should create sample" do
    assert_difference('Sample.count') do
      post samples_url, params: { sample: { name: "new sample", project_id: @project.id } }
    end

    assert_redirected_to sample_url(Sample.last)
  end

  test "upsert with token authentication via query params" do
    get upsert_samples_url, params: { user_email: @user.email, user_token: @user.authentication_token }
    assert_response :success
  end

  test "upsert with token authentication via request headers" do
    @request.headers['X-User-Email'] = @user.email
    @request.headers['X-User-Token'] = @user.authentication_token

    get upsert_samples_url
    assert_response :success
  end



  test "should show sample" do
    get sample_url(@sample)
    assert_response :success
  end

  test "should get edit" do
    get edit_sample_url(@sample)
    assert_response :success
  end

  test "should update sample" do
    patch sample_url(@sample), params: { sample: { name: @sample.name + " asdf"} }
    assert_redirected_to sample_url(@sample)
  end

  test "should destroy sample" do
    assert_difference('Sample.count', -1) do
      delete sample_url(@sample)
    end

    assert_redirected_to samples_url
  end
end
