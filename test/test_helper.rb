require File.expand_path('../../config/environment', __FILE__)
require 'rails/test_help'

require 'coveralls'
Coveralls.wear!

class ActiveSupport::TestCase
  # Setup all fixtures in test/fixtures/*.yml for all tests in alphabetical order.
  fixtures :all

  def access_sample_with_background(background, sample)
    get "/samples/#{sample.id}?background_id=#{background.id}"
  end
end
