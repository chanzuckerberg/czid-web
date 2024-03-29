module.exports = {
  // ...
  // Configuration options accepted by the `relay-compiler` command-line tool and `babel-plugin-relay`.
  src: "./app/assets/src",
  language: "typescript", // "javascript" | "typescript" | "flow"
  schema: "./graphql_schema/czid_graphql_federation_schema.graphql",
  schemaConfig: {
        nodeInterfaceIdField: "_id",
  },
  excludes: ["**/node_modules/**", "**/__mocks__/**", "**/__generated__/**"],
};
