require "graphql/rake_task"
GraphQL::RakeTask.new(
  schema_name: "IdseqSchema",
  idl_outfile: "graphql_schema/czid_rails_schema.graphql",
  json_outfile: "graphql_schema/czid_rails_schema.json"
)
