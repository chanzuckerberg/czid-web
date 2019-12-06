require 'test_helper'

class AdminControllerTest < ActionDispatch::IntegrationTest
  setup do
    @user_to_modify = users(:regular_user)
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
    get edit_user_url(@user_to_modify)
    assert_response :success
  end

  test 'should destroy user' do
    assert_difference('User.count', -1) do
      delete user_url(@user_to_modify)
    end

    assert_redirected_to users_url
  end
end
