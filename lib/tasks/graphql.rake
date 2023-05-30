require "graphql/rake_task"
GraphQL::RakeTask.new(
  schema_name: "IdseqSchema",
  idl_outfile: "graphql_schema/schema.graphql",
  json_outfile: "graphql_schema/schema.json"
)
