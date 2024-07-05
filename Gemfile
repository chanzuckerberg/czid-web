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

# -- AWS resources:
# TODO: We want to replace 'aws-sdk' with only the service gems we use.
gem 'aws-sdk'
gem 'aws-sdk-ecs'
gem 'aws-sdk-resources'
gem "aws-sdk-sqs"
gem 'aws-sdk-states'

gem 'brakeman', '~> 6.1.2', require: false
# Use ActiveModel has_secure_password
gem 'bcrypt', '~> 3.1.7'
gem 'consul', '~> 1.0.3'
gem 'data_migrate'
gem 'health_check', '~> 3.1.0'
# Build JSON APIs with ease. Read more: https://github.com/rails/jbuilder
gem 'jbuilder', '~> 2.11'
# Logger
gem 'lograge'
gem 'multipart-post'
gem 'silencer'
# elasticsearch
# these are the latest versions that work with opensearch https://opensearch.org/docs/1.0/clients/index/#legacy-clients
gem 'elasticsearch', '7.10.1'
gem 'elasticsearch-model', '7.1.1'
# Use mysql as the database for Active Record
gem 'mysql2'
gem 'oj'
gem 'parallel', '1.14.0'
# Use Puma as the app server
gem 'puma', '~> 5.6'
# Use Redis adapter to run Action Cable in production
gem 'redis', '~> 4.3'
# Sprockets
gem 'sprockets-rails'

# Bundle edge Rails instead: gem 'rails', github: 'rails/rails'
gem 'rails', '~>7.0.0'
gem 'rails-controller-testing', '~> 1.0', '>= 1.0.5'
gem 'railties', '~> 7.0'
gem 'rake'
# Worker/Scheduler management
gem 'resque', '~> 2.3'
gem 'resque-lock'
gem 'resque-retry', '~>1.8'
gem 'resque-scheduler', '~> 4.6'
gem 'thread'
# SentryIO
gem "sentry-raven"
# Use SCSS for stylesheets
gem 'sprockets-es6'
gem "strong_migrations"
# Turbolinks makes navigating your web application faster. Read more: https://github.com/turbolinks/turbolinks
gem 'turbolinks', '~> 5'
# Use Uglifier as compressor for JavaScript assets
gem 'uglifier', '~> 4.1'
# Redirect
gem 'activesupport'
gem 'rack-host-redirect'
gem 'useragent'

# Auto terminate long running operation
gem 'timeout', '~> 0.4.0'

# Performance profiling in all envs
gem 'flamegraph'
gem 'memory_profiler'
gem 'rack-mini-profiler', '~> 3.0' # https://github.com/rails/rails/issues/42261
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
gem 'csv-safe', '~> 3.0'

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

gem 'factory_bot_rails'

group :development, :test do
  # Call 'byebug' anywhere in the code to stop execution and get a debugger console
  gem 'byebug', platforms: [:mri, :mingw, :x64_mingw]
  # Adds support for Capybara system testing and selenium driver
  gem 'capybara', '~> 2.17', '>= 2.17.0'
  gem 'guard', '~> 2.15'
  gem 'rspec-rails', '~> 5.1'
  gem 'rubocop', '~> 0.92'
  gem "rubocop-graphql", "~> 0.14.5"
  gem 'rubocop-performance'
  gem 'rubocop-rails'
  gem 'selenium-webdriver'
  gem 'simplecov', require: false
end

group :development do
  gem 'amazing_print'
  gem 'bullet'
  gem 'listen', '~> 3.7'
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
gem "omniauth-auth0", "~> 3.0"
gem "omniauth-rails_csrf_protection", "~> 1.0"

gem "jwt", "~> 2.2"

# Background processing based on AWS SQS
gem "shoryuken"

# GraphQL-related
gem 'graphiql-rails', group: :development
gem "graphql"
gem 'graphql-client'

# required for Ruby 3 upgrade
# https://stackoverflow.com/questions/70500220/rails-7-ruby-3-1-loaderror-cannot-load-such-file-net-smtp
# upgrade to Rails >= 7.0.1 will fix this too
gem 'net-imap', require: false
gem 'net-pop', require: false
gem 'net-smtp', require: false

# need version >= 1.2.3 for M1 macs - https://github.com/cotag/http-parser/issues/12
gem 'http-parser', '~> 1.2.3'

gem 'seed_migration', git: "https://github.com/pboling/seed_migration", ref: "e919b6bf89ef33972e48c4c604337ca29b552121"
