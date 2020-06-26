# This file is used by Rack-based servers to start the application.

require_relative 'config/environment'

require 'rack'

# use Rack::Deflater, if: ->(_, _, _, body) { body.any? && body[0].length > 512 }

# run ->(_) { [200, {'Content-Type' => 'text/html'}, ['OK']] }

run Rails.application
