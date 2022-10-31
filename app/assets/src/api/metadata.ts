import { set, flatten } from "lodash/fp";

import { get, postWithCSRF } from "./core";

// Get metadata for a particular sample.
// We might be able to deprecate this...
const getSampleMetadata = ({
  id,
  pipelineVersion = null,
  snapshotShareId = null,
}: $TSFixMe) => {
  if (snapshotShareId) {
    return get(
      `/pub/${snapshotShareId}/samples/${id}/metadata?pipeline_version=${pipelineVersion}`,
    );
  } else {
    return get(`/samples/${id}/metadata`, {
      params: {
        pipeline_version: pipelineVersion,
      },
    });
  }
};

// Get MetadataField info for the sample(s) (either one ID or an array)
const getSampleMetadataFields = (ids: $TSFixMe, snapshotShareId?: $TSFixMe) =>
  postWithCSRF(
    (snapshotShareId ? `/pub/${snapshotShareId}` : "") +
      "/samples/metadata_fields",
    {
      sampleIds: flatten([ids]),
    },
  );

// Get MetadataField info for the sample(s) (either one ID or an array)
const getProjectMetadataFields = (ids: number | number[]) =>
  get("/projects/metadata_fields", {
    params: {
      projectIds: flatten([ids]),
    },
  });

// Get MetadataField info for the workflow run(s) (either one ID or an array)
const getWorkflowRunMetadataFields = (
  ids: $TSFixMe,
  snapshotShareId: $TSFixMe,
) =>
  postWithCSRF(
    (snapshotShareId ? `/pub/${snapshotShareId}` : "") +
      "/workflow_runs/metadata_fields",
    {
      workflowRunIds: flatten([ids]),
    },
  );

const saveSampleMetadata = (id: $TSFixMe, field: $TSFixMe, value: $TSFixMe) =>
  postWithCSRF(`/samples/${id}/save_metadata_v2`, {
    field,
    value,
  });

// Validate CSV metadata against samples in an existing project.
const validateMetadataCSVForProject = (id: $TSFixMe, metadata: $TSFixMe) =>
  postWithCSRF(`/projects/${id}/validate_metadata_csv`, {
    metadata,
  });

// Validate manually input metadata against samples in an existing project.
const validateManualMetadataForProject = (id: $TSFixMe, metadata: $TSFixMe) => {
  // Convert manual metadata into a csv-like format and use the csv endpoint for validation.
  const metadataAsCSV = set(
    "rows",
    metadata.rows.map((row: $TSFixMe) =>
      metadata.headers.map((header: $TSFixMe) => row[header] || ""),
    ),
    metadata,
  );

  return validateMetadataCSVForProject(id, metadataAsCSV);
};

// Validate CSV metadata for new samples.
// For samples, we just require { name, host_genome_id }
const validateMetadataCSVForNewSamples = (
  samples: $TSFixMe,
  metadata: $TSFixMe,
) =>
  postWithCSRF("/metadata/validate_csv_for_new_samples", {
    metadata,
    samples,
  });

// Validate manually input metadata for new samples.
const validateManualMetadataForNewSamples = (
  samples: $TSFixMe,
  metadata: $TSFixMe,
) => {
  // Convert manual metadata into a csv-like format and use the csv endpoint for validation.
  const metadataAsCSV = set(
    "rows",
    metadata.rows.map((row: $TSFixMe) =>
      metadata.headers.map((header: $TSFixMe) => row[header] || ""),
    ),
    metadata,
  );

  return validateMetadataCSVForNewSamples(samples, metadataAsCSV);
};

const uploadMetadataForProject = (id: $TSFixMe, metadata: $TSFixMe) =>
  postWithCSRF(`/projects/${id}/upload_metadata`, {
    metadata,
  });

const getOfficialMetadataFields = () =>
  get("/metadata/official_metadata_fields");

export {
  getOfficialMetadataFields,
  getSampleMetadata,
  getSampleMetadataFields,
  getProjectMetadataFields,
  getWorkflowRunMetadataFields,
  saveSampleMetadata,
  uploadMetadataForProject,
  validateMetadataCSVForProject,
  validateMetadataCSVForNewSamples,
  validateManualMetadataForProject,
  validateManualMetadataForNewSamples,
};
