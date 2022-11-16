import { WORKFLOW_ENTITIES } from "~utils/workflows";
import { get, postWithCSRF } from "./core";

export const getBulkDownloadTypes = (workflow: $TSFixMe) =>
  get(`/bulk_downloads/types?workflow=${workflow}`);

export const createBulkDownload = (bulkDownload: $TSFixMe) =>
  postWithCSRF("/bulk_downloads", {
    download_type: bulkDownload.downloadType,
    ...(bulkDownload.workflowEntity === WORKFLOW_ENTITIES.SAMPLES
      ? { sample_ids: bulkDownload.validObjectIds }
      : { workflow_run_ids: bulkDownload.validObjectIds }),
    workflow: bulkDownload.workflow,
    params: {sample_ids: { value: bulkDownload.validObjectIds }, ...bulkDownload.fields},
  });

export const getBulkDownloads = () => get("/bulk_downloads.json");

export const getBulkDownload = (bulkDownloadId: $TSFixMe) =>
  get(`/bulk_downloads/${bulkDownloadId}.json`);

export const getPresignedOutputUrl = (bulkDownloadId: $TSFixMe) =>
  get(`/bulk_downloads/${bulkDownloadId}/presigned_output_url`);
