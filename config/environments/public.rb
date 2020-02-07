# Base off staging config + static assets.
# Only diff between prod and staging was this one setting.
require File.expand_path('../staging.rb', __FILE__)
config.serve_static_assets = true
