require "graphql/client/http"

namespace :czid_graphql_federation do
  # This rake task needs to be run periodically to get the latest schema,
  # and the schema JSON file should be checked in to the repository.
  # An offline copy of the schema allows queries to be typed checked statically
  # before even sending a request.

  desc "Update CZ ID GraphQL Federation schema"
  task update_schema: :environment do
    GraphQL::Client.dump_schema(CzidGraphqlFederation::HttpAdapter, CzidGraphqlFederation::SCHEMA_FILE_PATH)
  end
end
