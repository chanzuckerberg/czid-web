require 'test_helper'

class AdminControllerTest < ActionDispatch::IntegrationTest
  setup do
    @user = users(:one)
    post user_session_path, params: { 'user[email]' => @user.email, 'user[password]' => 'password' }
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
    get edit_user_url(@user)
    assert_response :success
  end

  test 'should destroy user' do
    assert_difference('User.count', -1) do
      delete user_url(@user)
    end

    assert_redirected_to users_url
  end
end
