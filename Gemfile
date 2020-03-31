source 'https://rubygems.org'

git_source(:github) do |repo_name|
  repo_name = "#{repo_name}/#{repo_name}" unless repo_name.include?('/')
  "https://github.com/#{repo_name}.git"
end

gem 'airbrake', '~> 9.5'
gem 'aws-sdk-ecs'
gem 'aws-sdk-resources'
gem 'brakeman'
# Use ActiveModel has_secure_password
gem 'bcrypt', '~> 3.1.7'
# Use CoffeeScript for .coffee assets and views
gem 'coffee-rails', '~> 4.2', '>= 4.2.2'
gem 'consul', '>= 0.13.1'
gem 'health_check', '>= 2.7.0'
gem 'honeycomb-rails', '>= 0.8.1'
gem 'mailgun_rails', '>= 0.9.0'
# Build JSON APIs with ease. Read more: https://github.com/rails/jbuilder
gem 'jbuilder', '~> 2.5'
# Logger
gem 'logging-rails', require: 'logging/rails'
gem 'lograge'
gem 'lograge-sql'
gem 'multipart-post'
gem 'silencer'
# elasticsearch
gem 'elasticsearch-model'
# Use mysql as the database for Active Record
gem 'mysql2'
gem 'oj'
gem 'parallel', '1.14.0'
gem 'prometheus-client', '0.7.1'
# Use Puma as the app server
gem 'puma', '~> 3.12'
# Use Redis adapter to run Action Cable in production
# gem 'redis', '~> 3.0'
# Bundle edge Rails instead: gem 'rails', github: 'rails/rails'
gem 'rails', '~> 5.1.5'
gem 'rails-controller-testing'
gem 'rake'
# Worker/Scheduler management
gem 'resque', '>= 1.27.4'
gem 'resque-lock'
gem 'resque-scheduler', '>= 4.3.1'
gem 'thread'
# Use SCSS for stylesheets
gem 'sprockets-es6'
# Turbolinks makes navigating your web application faster. Read more: https://github.com/turbolinks/turbolinks
gem 'turbolinks', '~> 5'
# Use Uglifier as compressor for JavaScript assets
gem 'uglifier', '>= 1.3.0'
gem 'will_paginate'
# Use AWS-SDK to make AWS requests with byte range
gem 'aws-sdk'
# Redirect
gem 'activesupport'
gem 'rack-host-redirect'
gem 'useragent'

# Performance profiling in all envs
gem 'flamegraph'
gem 'memory_profiler'
gem 'rack-mini-profiler'
gem 'stackprof'

# Helps batch ActiveRecord calls
gem 'activerecord-import'

# Segment analytics for backend events
gem 'analytics-ruby', '~> 2.0.0', require: 'segment/analytics'

# Url shortener
gem 'shortener'

# Explicit load to avoid an 'unable to load' warning
gem 'http-2'

gem 'deep_cloneable', '~> 2.4.0'
# For using redis as a cache
gem 'redis-rails', '~> 5'
# For caching actions by request URL
gem 'actionpack-action_caching'
gem 'nokogiri'

# For adding foreign key constraints
gem 'immigrant'

# Better CSV handling
gem 'csv-safe', '~> 1.2'

# For accessing Auth0 management APIs
gem 'auth0'
gem 'warden', '~> 1.2'

# For Access-Control-Allow-Origin and Cloudfront
gem "rack-cors"

group :development, :test do
  # Call 'byebug' anywhere in the code to stop execution and get a debugger console
  gem 'bundler-audit'
  gem 'byebug', platforms: [:mri, :mingw, :x64_mingw]
  # Adds support for Capybara system testing and selenium driver
  gem 'capybara', '~> 2.17', '>= 2.17.0'
  gem 'factory_bot_rails'
  gem 'guard', '~> 2.15'
  gem 'guard-rspec', '~> 4.7'
  gem 'rspec-rails', '>= 3.7.2'
  gem 'rubocop', '=0.49.1'
  gem 'selenium-webdriver'
  gem 'simplecov', require: false
end

group :development do
  gem 'active_record_query_trace'
  gem 'listen', '>= 3.0.5', '< 3.2'
  # Access an IRB console on exception pages or by using <%= console %> anywhere in the code.
  gem 'web-console', '>= 3.5.1'
end

group :test do
  gem 'resque_spec'
  gem 'rspec-json_expectations'
  gem 'webmock', '~> 3.6'
end

# Windows does not include zoneinfo files, so bundle the tzinfo-data gem
gem 'tzinfo-data', platforms: [:mingw, :mswin, :x64_mingw, :jruby]

# HTTP library with a simpler, better designed API than the native Net::HTTP
gem 'http'
gem "omniauth-auth0", "~> 2.2"
gem "omniauth-rails_csrf_protection", "~> 0.1.2"

gem "jwt", "~> 2.2"
