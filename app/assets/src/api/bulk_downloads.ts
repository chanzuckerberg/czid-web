import { SampleMetadataResponseType } from "~/components/views/DiscoveryView/components/SamplesView/components/BulkDownloadModal/types";
import { BulkDownloadType } from "~/interface/shared";
import { WorkflowType, WORKFLOW_ENTITIES } from "~utils/workflows";
import { get, postWithCSRF } from "./core";

export const getBulkDownloadTypes = (
  workflow: WorkflowType,
): Promise<BulkDownloadType[]> =>
  get(`/bulk_downloads/types?workflow=${workflow}`);

export const getBulkDownloadMetrics = (workflow: $TSFixMe) =>
  get(`/bulk_downloads/metrics?workflow=${workflow}`);

export const createBulkDownload = (bulkDownload: $TSFixMe) =>
  postWithCSRF("/bulk_downloads", {
    download_type: bulkDownload.downloadType,
    ...(bulkDownload.workflowEntity === WORKFLOW_ENTITIES.SAMPLES
      ? { sample_ids: bulkDownload.validObjectIds }
      : { workflow_run_ids: bulkDownload.validObjectIds }),
    workflow: bulkDownload.workflow,
    params: {
      sample_ids: { value: bulkDownload.validObjectIds },
      workflow: { value: bulkDownload.workflow },
      ...bulkDownload.fields,
    },
  });

export const createSampleMetadataBulkDownload = (
  sampleIds: string[],
): Promise<SampleMetadataResponseType> =>
  postWithCSRF(`/bulk_downloads/sample_metadata`, { sample_ids: sampleIds });
