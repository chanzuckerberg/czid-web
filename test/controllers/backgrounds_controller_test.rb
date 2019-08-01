require 'test_helper'

class BackgroundsControllerTest < ActionDispatch::IntegrationTest
  setup do
    @background = backgrounds(:one)
    @user = users(:one)
    post user_session_path, params: { 'user[email]' => @user.email, 'user[password]' => 'password' }
  end

  test "should get index" do
    get backgrounds_url
    assert_response :success
  end

  test "should create background" do
    post backgrounds_url, params: { name: 'new_name', sample_ids: [samples(:expired_sample).id, samples(:public_sample).id] }
    resp = JSON.parse(@response.body)
    assert_equal "ok", resp['status']
  end

  test "should show background" do
    get background_url(@background)
    assert_response :success
  end

  test "should update background" do
    skip "This passes locally but fails in Travis because of s3 call. See archive_background_to_s3."
    patch background_url(@background), params: {
      background: {
        name: @background.name,
        pipeline_run_ids: @background.pipeline_runs.map(&:id),
      },
    }
    assert_redirected_to background_url(@background)
  end

  test "should destroy background" do
    assert_difference('Background.count', -1) do
      delete background_url(@background)
    end

    assert_redirected_to backgrounds_url
  end
end
