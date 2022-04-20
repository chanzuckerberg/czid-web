# Notes and guidelines:
# - Add a comment for every Gem/group so we know its purpose.
# - Gem ordering can matter, but otherwise try to sort gems into common
#   categories and alphabetize within the categories.
#
# Constraints:
# - By default, you should either not specify a version, or specify a
#   pessimistic constraint (twiddle-wakka) at the MAJOR or MINOR level (in
#   MAJOR.MINOR.PATCH).
# - Example: gem 'library', '~> 2.2' means it is free to upgrade to the highest
#   2.x but not 3.x (>= 2.2.0 and < 3.0).
# - Example: gem 'library', '~> 2' similarly means >= 2.0 and < 3.0.
# - We use MAJOR or MINOR because the PATCH level is too restrictive (we trust
#   that PATCH releases should be safe), but we still want some friction before
#   MAJOR upgrades happen since there may be breaking changes.
# - We don't specify precise versions because we generally expect later gem
#   versions to be compatible and have improvements.
# - If you need to enforce >= PATCH version, put it secondary. Example: gem
#   'library', '~> 2.2, '>= 2.2.5'

source 'https://rubygems.org'

git_source(:github) do |repo_name|
  repo_name = "#{repo_name}/#{repo_name}" unless repo_name.include?('/')
  "https://github.com/#{repo_name}.git"
end

# -- AWS resources:
# TODO: We want to replace 'aws-sdk' with only the service gems we use.
gem 'aws-sdk'
gem 'aws-sdk-ecs'
gem 'aws-sdk-resources'
gem "aws-sdk-sqs"
gem 'aws-sdk-states'

gem 'brakeman'
# Use ActiveModel has_secure_password
gem 'bcrypt', '~> 3.1.7'
gem 'consul', '>= 0.13.1'
gem 'data_migrate'
gem 'health_check', '>= 2.7.0'
# Build JSON APIs with ease. Read more: https://github.com/rails/jbuilder
gem 'jbuilder', '~> 2.11'
# Logger
gem 'lograge'
gem 'multipart-post'
gem 'silencer'
# elasticsearch
gem 'elasticsearch-model'
# Use mysql as the database for Active Record
gem 'mysql2'
gem 'oj'
gem 'parallel', '1.14.0'
# Use Puma as the app server
gem 'puma', '~> 5.6'
# Use Redis adapter to run Action Cable in production
gem 'redis', '~> 4.3'

# Bundle edge Rails instead: gem 'rails', github: 'rails/rails'
gem 'rails', '~> 6.1'
gem 'rails-controller-testing'
gem 'rake'
# Worker/Scheduler management
gem 'resque', '>= 1.27.4'
gem 'resque-lock'
gem 'resque-scheduler', '>= 4.3.1'
gem 'thread'
# SentryIO
gem "sentry-raven"
# Use SCSS for stylesheets
gem 'sprockets-es6'
# Turbolinks makes navigating your web application faster. Read more: https://github.com/turbolinks/turbolinks
gem 'turbolinks', '~> 5'
# Use Uglifier as compressor for JavaScript assets
gem 'uglifier', '>= 1.3.0'
gem 'will_paginate'
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
gem 'activerecord-import', '~> 1.1'

# Segment analytics for backend events
gem 'analytics-ruby', '~> 2.0.0', require: 'segment/analytics'

# Url shortener
gem 'shortener'

# Explicit load to avoid an 'unable to load' warning
gem 'http-2'

gem 'deep_cloneable', '~> 3.1'

# For caching actions by request URL
gem 'actionpack-action_caching', '~> 1.2'
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

# For structured logging
gem 'ougai'

# For loading all files in a directory
gem 'require_all'

gem 'pluck_to_hash'

group :development, :test do
  # Call 'byebug' anywhere in the code to stop execution and get a debugger console
  gem 'byebug', platforms: [:mri, :mingw, :x64_mingw]
  # Adds support for Capybara system testing and selenium driver
  gem 'capybara', '~> 2.17', '>= 2.17.0'
  gem 'factory_bot_rails'
  gem 'guard', '~> 2.15'
  gem 'rspec-rails', '~> 5.0'
  gem 'rubocop', '>=0.92'
  gem 'rubocop-performance'
  gem 'rubocop-rails'
  gem 'selenium-webdriver'
  gem 'simplecov', require: false
end

group :development do
  gem 'amazing_print'
  gem 'listen', '>= 3.0.5', '< 3.2'
  # Access an IRB console on exception pages or by using <%= console %> anywhere in the code.
  gem 'web-console', '>= 3.5.1'
end

group :test do
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

gem "ssrfs-up", "~> 0.0.19" # https://github.com/chanzuckerberg/SSRFs-Up

# Background processing based on AWS SQS
gem "shoryuken"

# GraphQL-related
gem 'graphiql-rails', group: :development
gem "graphql"
