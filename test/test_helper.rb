require File.expand_path('../../config/environment', __FILE__)
require 'rails/test_help'

require 'coveralls'
Coveralls.wear!

require 'minitest/autorun'

class ActiveSupport::TestCase
  # Setup all fixtures in test/fixtures/*.yml for all tests in alphabetical order.
  fixtures :all

  def access_sample_with_background(background, sample)
    get "/samples/#{sample.id}?background_id=#{background.id}"
  end

  def sign_in(user)
    @user = users(user)
    post user_session_path, params: { 'user[email]' => @user.email, 'user[password]' => 'password' }
  end
end
