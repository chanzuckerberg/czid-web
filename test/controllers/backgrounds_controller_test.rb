require 'test_helper'

class BackgroundsControllerTest < ActionDispatch::IntegrationTest
  setup do
    @background = backgrounds(:one)
  end

  test "should get index" do
    get backgrounds_url
    assert_response :success
  end

  test "should get new" do
    get new_background_url
    assert_response :success
  end

  test "should create background" do
    assert_difference('Background.count') do
      post backgrounds_url, params: { background: { name: @background.name } }
    end

    assert_redirected_to background_url(Background.last)
  end

  test "should show background" do
    get background_url(@background)
    assert_response :success
  end

  test "should get edit" do
    get edit_background_url(@background)
    assert_response :success
  end

  test "should update background" do
    patch background_url(@background), params: { background: { name: @background.name } }
    assert_redirected_to background_url(@background)
  end

  test "should destroy background" do
    assert_difference('Background.count', -1) do
      delete background_url(@background)
    end

    assert_redirected_to backgrounds_url
  end
end
