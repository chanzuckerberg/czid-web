import { InMemoryCache, makeVar } from "@apollo/client";
import { AmrFilterSelections } from "~/interface/sampleView";
import { BulkDownloadDetails, DownloadType } from "~/interface/shared";

export const exampleVar = makeVar<string[]>([]);
export const selectedBulkDownloadVar = makeVar<{
  bulkDownload: BulkDownloadDetails;
  downloadType?: DownloadType;
}>(null);
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
