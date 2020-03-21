require 'test_helper'

class BackgroundsControllerTest < ActionDispatch::IntegrationTest
  setup do
    @background = backgrounds(:one)
    @user = users(:admin_one)
    sign_in @user
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

  test "should destroy background" do
    assert_difference('Background.count', -1) do
      delete background_url(@background)
    end

    assert_redirected_to backgrounds_url
  end
end
