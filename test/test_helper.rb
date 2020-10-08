require File.expand_path('../config/environment', __dir__)
require 'rails/test_help'
require 'minitest/autorun'
require 'rspec/mocks/minitest_integration'
require 'simplecov'

SimpleCov.command_name "Rails Tests"

class ActiveSupport::TestCase
  include Warden::Test::Helpers

  # Setup all fixtures in test/fixtures/*.yml for all tests in alphabetical order.
  fixtures :all

  def access_sample_with_background(background, sample)
    get "/samples/#{sample.id}?background_id=#{background.id}"
  end

  def sign_in(user)
    unless user.instance_of? User
      user = users(user)
    end

    # this is emulating a successfully decoded and valid auth0 bearer token
    roles = user.admin? ? ["admin"] : []
    decoded_auth0_token = { authenticated: true, auth_payload: { "email" => user.email, "exp" => DateTime.now.to_i + 10.hours, Auth0Helper::ROLES_CUSTOM_CLAIM => roles } }
    allow_any_instance_of(Auth0Helper).to receive(:auth0_decode_auth_token) { decoded_auth0_token }

    OmniAuth.config.test_mode = true
    OmniAuth.config.add_mock(:auth0)
    post "/auth/auth0"
    follow_redirect!
  end

  def setup
    # We don't want our tests invoking real auth0 client
    @auth0_management_client_double = double("Auth0Client")
    allow(Auth0UserManagementHelper).to receive(:auth0_management_client).and_return(@auth0_management_client_double)
  end

  def teardown
    OmniAuth.config.mock_auth[:auth0] = nil
    OmniAuth.config.test_mode = false
  end
end
