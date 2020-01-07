require 'test_helper'

class ApplicationControllerTest < ActionDispatch::IntegrationTest
  setup do
    @user = users(:admin_one)
  end

  test 'should redirect user to auth0 login' do
    get new_user_session_path
    assert_redirected_to url_for(controller: :auth0, action: :refresh_token, params: { mode: "login" })
  end

  test 'should redirect user to auth0 log out url when logging out' do
    sign_in @user
    post destroy_user_session_path
    assert_response :redirect
    assert_equal "https://#{ENV['AUTH0_DOMAIN']}/v2/logout", @response.redirect_url.split("?").first
  end

  test 'request should fail if user is not logged in' do
    post projects_url, params: { project: { name: 'New Project' } }
    assert_redirected_to new_user_session_url
  end

  test 'request should fail if user has already logged out' do
    sign_in @user
    post destroy_user_session_path
    post projects_url, params: { project: { name: 'New Project' } }
    assert_redirected_to new_user_session_url
  end

  test 'should increment login counter' do
    previous_count = User.find(@user.id).sign_in_count
    sign_in @user
    new_count = User.find(@user.id).sign_in_count
    assert_equal previous_count + 1, new_count
  end
end
