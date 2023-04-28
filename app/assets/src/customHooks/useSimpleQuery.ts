import { DocumentNode, useQuery } from "@apollo/client";

export const useSimpleQuery = (queryName: DocumentNode, variables: object) => {
  return useQuery(queryName, {
    variables,
  });
};
