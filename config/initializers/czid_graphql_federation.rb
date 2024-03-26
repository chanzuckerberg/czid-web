require "graphql/client"
require "graphql/client/http"

# This configuration may run into issues if attempting to perform queries
# in an ERB template.  If you run into issues, the client may need to be
# configured as described here:
# https://github.com/github-community-projects/graphql-client/blob/master/guides/rails-configuration.md#configure
module CzidGraphqlFederation
  SCHEMA_FILE_PATH = "db/czid_graphql_federation_schema.json".freeze

  if ENV['GRAPHQL_FEDERATION_SERVICE_URL'].nil?
    Rails.logger.error("GraphQL Federation service URL is invalid, queries to service will fail.")
  end

  graphql_federation_service_url = ENV['GRAPHQL_FEDERATION_SERVICE_URL'] || ""
  HttpAdapter = GraphQL::Client::HTTP.new(graphql_federation_service_url) do
    def headers(context)
      headers = {}
      headers["Authorization"] = "Bearer #{context[:token]}" if context[:token]

      headers
    end
  end

  Schema = GraphQL::Client.load_schema(SCHEMA_FILE_PATH)

  Client = GraphQL::Client.new(schema: Schema, execute: HttpAdapter)

  def self.query_with_token(user_id, query, variables: {}, context: {}, token: nil)
    context[:token] = if !token.nil?
                        token
                      else
                        TokenCreationService.call(user_id: user_id, should_include_project_claims: true, service_identity: "rails")["token"]
                      end

    resp = Client.query(query, variables: variables, context: context)
    if resp.errors.any?
      err_msg = resp&.errors&.details&.to_h
      LogUtil.log_error(
        "GraphQL federation query failed: #{err_msg}",
        exception: GraphQL::ExecutionError.new(err_msg),
        query_name: query.operation_name
      )
    end
    return resp
  end
end
