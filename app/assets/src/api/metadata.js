import { set, flatten } from "lodash/fp";

import { get, postWithCSRF } from "./core";

// Get metadata for a particular sample.
// We might be able to deprecate this...
const getSampleMetadata = ({
  id,
  pipelineVersion = null,
  snapshotShareId = null,
}) => {
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
const getSampleMetadataFields = (ids, snapshotShareId) =>
  postWithCSRF(
    (snapshotShareId ? `/pub/${snapshotShareId}` : "") +
      "/samples/metadata_fields",
    {
      sampleIds: flatten([ids]),
    },
  );

// Get MetadataField info for the sample(s) (either one ID or an array)
const getProjectMetadataFields = ids =>
  get("/projects/metadata_fields", {
    params: {
      projectIds: flatten([ids]),
    },
  });

const saveSampleMetadata = (id, field, value) =>
  postWithCSRF(`/samples/${id}/save_metadata_v2`, {
    field,
    value,
  });

// Validate CSV metadata against samples in an existing project.
const validateMetadataCSVForProject = (id, metadata) =>
  postWithCSRF(`/projects/${id}/validate_metadata_csv`, {
    metadata,
  });

// Validate manually input metadata against samples in an existing project.
const validateManualMetadataForProject = (id, metadata) => {
  // Convert manual metadata into a csv-like format and use the csv endpoint for validation.
  const metadataAsCSV = set(
    "rows",
    metadata.rows.map(row => metadata.headers.map(header => row[header] || "")),
    metadata,
  );

  return validateMetadataCSVForProject(id, metadataAsCSV);
};

// Validate CSV metadata for new samples.
// For samples, we just require { name, host_genome_id }
const validateMetadataCSVForNewSamples = (samples, metadata) =>
  postWithCSRF("/metadata/validate_csv_for_new_samples", {
    metadata,
    samples,
  });

// Validate manually input metadata for new samples.
const validateManualMetadataForNewSamples = (samples, metadata) => {
  // Convert manual metadata into a csv-like format and use the csv endpoint for validation.
  const metadataAsCSV = set(
    "rows",
    metadata.rows.map(row => metadata.headers.map(header => row[header] || "")),
    metadata,
  );

  return validateMetadataCSVForNewSamples(samples, metadataAsCSV);
};

const uploadMetadataForProject = (id, metadata) =>
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
  saveSampleMetadata,
  uploadMetadataForProject,
  validateMetadataCSVForProject,
  validateMetadataCSVForNewSamples,
  validateManualMetadataForProject,
  validateManualMetadataForNewSamples,
};
