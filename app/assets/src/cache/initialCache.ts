import { InMemoryCache, makeVar } from "@apollo/client";
import { AmrFilterSelections } from "~/interface/sampleView";

export const exampleVar = makeVar<string[]>([]);
export const amrReportTableDownloadWithAppliedFiltersLinkVar =
  // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2345
  makeVar<string>(null);
// @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2345
export const activeAmrFiltersVar = makeVar<AmrFilterSelections>(null);
// @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2345
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
