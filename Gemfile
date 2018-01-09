source 'https://rubygems.org'

git_source(:github) do |repo_name|
  repo_name = "#{repo_name}/#{repo_name}" unless repo_name.include?('/')
  "https://github.com/#{repo_name}.git"
end
gem 'airbrake', '~> 7.0'
gem 'airbrake-ruby'
gem 'aws-sdk-ecs'
gem 'aws-sdk-resources'
gem 'brakeman'
# Use ActiveModel has_secure_password
gem 'bcrypt', '~> 3.1.7'
# Use CoffeeScript for .coffee assets and views
gem 'coffee-rails', '~> 4.2'
gem 'devise', '4.3.0'
gem "health_check"
gem 'honeycomb-rails'
gem 'mailgun_rails'
# Build JSON APIs with ease. Read more: https://github.com/rails/jbuilder
gem 'jbuilder', '~> 2.5'
# Logger
gem 'logger'
gem 'multipart-post'
# Use mysql as the database for Active Record
gem 'mysql2'
gem 'prometheus-client', '0.7.1'
# Use Puma as the app server
gem 'puma', '~> 3.7'
# Use Redis adapter to run Action Cable in production
# gem 'redis', '~> 3.0'
# Bundle edge Rails instead: gem 'rails', github: 'rails/rails'
gem 'rails', '~> 5.1.2'
gem 'rake'
# Worker/Scheduler management
gem 'resque'
gem 'resque-lock'
gem 'resque-scheduler'
# Use SCSS for stylesheets
gem 'simple_token_authentication', '~> 1.0' # see semver.org
gem 'sprockets-es6'
# Turbolinks makes navigating your web application faster. Read more: https://github.com/turbolinks/turbolinks
gem 'turbolinks', '~> 5'
# Use Uglifier as compressor for JavaScript assets
gem 'uglifier', '>= 1.3.0'
gem 'will_paginate'
# Use AWS-SDK to make AWS requests with byte range
gem 'aws-sdk'

group :development, :test do
  # Call 'byebug' anywhere in the code to stop execution and get a debugger console
  gem 'byebug', platforms: [:mri, :mingw, :x64_mingw]
  # Adds support for Capybara system testing and selenium driver
  gem 'capybara', '~> 2.13'
  gem 'coveralls', require: false
  gem 'rspec-rails'
  gem 'rubocop', '=0.49.1'
  gem 'selenium-webdriver'
end

group :development do
  gem 'listen', '>= 3.0.5', '< 3.2'
  # Spring speeds up development by keeping your application running in the background. Read more: https://github.com/rails/spring
  gem 'spring'
  gem 'spring-watcher-listen', '~> 2.0.0'
  # Access an IRB console on exception pages or by using <%= console %> anywhere in the code.
  gem 'web-console', '>= 3.3.0'
end

# Windows does not include zoneinfo files, so bundle the tzinfo-data gem
gem 'tzinfo-data', platforms: [:mingw, :mswin, :x64_mingw, :jruby]
