import { gql } from "@apollo/client";

export const typeDefs = gql`
  # The following is an example of how to add schemas to Queries
  extend type Query {
    hello: [String!]!
  }
`;
