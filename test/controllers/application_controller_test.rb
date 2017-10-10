require 'test_helper'

class ApplicationControllerTest < ActionDispatch::IntegrationTest
  setup do
    @user = users(:one)
    @user_params = { 'user[email]' => @user.email, 'user[password]' => 'password' }
  end

  test 'should log in' do
    post user_session_path, params: @user_params
    assert_redirected_to root_url
  end

  test 'should log out' do
    post user_session_path, params: @user_params
    delete destroy_user_session_url
    post projects_url, params: { project: { name: 'New Project' } }
    assert_redirected_to new_user_session_url
  end

  test 'log in should fail' do
    post user_session_path, params: { 'user[email]' => @user.email, 'user[password]' => 'badpass' }
    assert_equal flash[:alert], 'Invalid Email or password.'
  end
end
