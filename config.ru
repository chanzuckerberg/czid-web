# This file is used by Rack-based servers to start the application.

require_relative 'config/environment'

require 'rack'
require 'prometheus/middleware/collector'
require 'prometheus/middleware/exporter'

# use Rack::Deflater, if: ->(_, _, _, body) { body.any? && body[0].length > 512 }
use Prometheus::Middleware::Collector
use Prometheus::Middleware::Exporter

# run ->(_) { [200, {'Content-Type' => 'text/html'}, ['OK']] }

run Rails.application
