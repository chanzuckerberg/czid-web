require 'test_helper'

class AdminControllerTest < ActionDispatch::IntegrationTest
  setup do
    @edited_user = users(:regular_user)
    sign_in :admin_one
  end

  test 'should get index' do
    get users_url
    assert_response :success
  end

  test 'should get new' do
    get new_user_url
    assert_response :success
  end

  test 'should get edit' do
    get edit_user_url(@edited_user)
    assert_response :success
  end

  test 'should destroy user' do
    assert_difference('User.count', -1) do
      delete user_url(@edited_user)
    end

    assert_redirected_to users_url
  end
end
