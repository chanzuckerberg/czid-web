require File.expand_path('../../config/environment', __FILE__)
require 'rails/test_help'

require 'coveralls'
Coveralls.wear!

class ActiveSupport::TestCase
  # Setup all fixtures in test/fixtures/*.yml for all tests in alphabetical order.
  fixtures :all

  def access_sample_with_background(background, sample, expected_response)
    get "/samples/#{sample.id}?background_id=#{background.id}"
    assert_response expected_response
  end
end
