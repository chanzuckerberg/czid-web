import { InMemoryCache, makeVar } from "@apollo/client";
import { AmrFilterSelections } from "~/interface/sampleView";

export const exampleVar = makeVar<string[]>([]);
export const amrReportTableDownloadWithAppliedFiltersLinkVar =
  makeVar<string>(null);
export const activeAmrFiltersVar = makeVar<AmrFilterSelections>(null);
export const amrDrugClassesVar = makeVar<string[]>(null);

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
