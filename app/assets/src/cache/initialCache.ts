import { InMemoryCache, makeVar } from "@apollo/client";
import { BulkDownloadDetails, DownloadType } from "~/interface/shared";

export const exampleVar = makeVar<string[]>([]);
export const selectedBulkDownloadVar = makeVar<{
  bulkDownload: BulkDownloadDetails;
  downloadType?: DownloadType;
}>(null);

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
  },
});
