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
    @mock_aws_clients = {
      s3: Aws::S3::Client.new(stub_responses: true),
      states: Aws::States::Client.new(stub_responses: true),
    }
    allow(AwsClient).to receive(:[]) { |client|
      @mock_aws_clients[client]
    }
    expect(@auth0_management_client_double)
      .to(receive(:users_by_email)
          .with(@user_to_modify.email, fields: "identities")
          .and_return([{ "identities" => [{ "provider" => "auth0", "user_id" => "FAKE_USER_ID" }] }]))

    expect(@auth0_management_client_double).to receive(:delete_user).with("auth0|FAKE_USER_ID")

    assert_difference('User.count', -1) do
      delete user_url(@user_to_modify)
    end

    assert_redirected_to users_url
  end
end
