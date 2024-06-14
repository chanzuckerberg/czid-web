# Load the Rails application.
require_relative "application"

# Initialize the Rails application.
Rails.application.initialize!

# CZID specific
# Ignore tables in database prefixed with "_" such as _new_taxid_lineages.
ActiveRecord::SchemaDumper.ignore_tables = [/^_/]
