import { get, postWithCSRF } from "./core";

export const getBulkDownloadTypes = () => get("/bulk_downloads/types");

export const createBulkDownload = bulkDownload =>
  postWithCSRF("/bulk_downloads", {
    download_type: bulkDownload.downloadType,
    sample_ids: bulkDownload.sampleIds,
    params: bulkDownload.fields,
  });
