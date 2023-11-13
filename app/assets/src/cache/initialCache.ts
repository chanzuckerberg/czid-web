import { InMemoryCache, makeVar } from "@apollo/client";

export const exampleVar = makeVar<string[]>([]);

export const initalCache = new InMemoryCache({
  typePolicies: {
    Query: {
      fields: {
        hello: {
          read() {
            return exampleVar();
          },
        },
      },
    },
    TaxonDescription: {
      keyFields: ["taxId"],
    },
  },
});
