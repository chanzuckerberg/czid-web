import { set } from "lodash/fp";

import { get, postWithCSRF } from "./core";

// Get metadata for a particular sample.
// We might be able to deprecate this...
const getSampleMetadata = (id, pipelineVersion) => {
  return get(
    pipelineVersion
      ? `/samples/${id}/metadata?pipeline_version=${pipelineVersion}`
      : `/samples/${id}/metadata`
  );
};

// Get MetadataField info for the sample(s) (either one ID or an array)
const getSampleMetadataFields = ids =>
  get("/samples/metadata_fields", {
    params: {
      sampleIds: [ids].flat()
    }
  });

// Get MetadataField info for the sample(s) (either one ID or an array)
const getProjectMetadataFields = ids =>
  get("/projects/metadata_fields", {
    params: {
      projectIds: [ids].flat()
    }
  });

const saveSampleMetadata = (id, field, value) =>
  postWithCSRF(`/samples/${id}/save_metadata_v2`, {
    field,
    value
  });

// Validate CSV metadata against samples in an existing project.
const validateMetadataCSVForProject = (id, metadata) =>
  postWithCSRF(`/projects/${id}/validate_metadata_csv`, {
    metadata
  });

// Validate manually input metadata against samples in an existing project.
const validateManualMetadataForProject = (id, metadata) => {
  // Convert manual metadata into a csv-like format and use the csv endpoint for validation.
  const metadataAsCSV = set(
    "rows",
    metadata.rows.map(row => metadata.headers.map(header => row[header] || "")),
    metadata
  );

  return validateMetadataCSVForProject(id, metadataAsCSV);
};

// Validate CSV metadata for new samples.
// For samples, we just require { name, host_genome_id }
const validateMetadataCSVForNewSamples = (samples, metadata) =>
  postWithCSRF("/metadata/validate_csv_for_new_samples", {
    metadata,
    samples
  });

// Validate manually input metadata for new samples.
const validateManualMetadataForNewSamples = (samples, metadata) => {
  // Convert manual metadata into a csv-like format and use the csv endpoint for validation.
  const metadataAsCSV = set(
    "rows",
    metadata.rows.map(row => metadata.headers.map(header => row[header] || "")),
    metadata
  );

  return validateMetadataCSVForNewSamples(samples, metadataAsCSV);
};

const uploadMetadataForProject = (id, metadata) =>
  postWithCSRF(`/projects/${id}/upload_metadata`, {
    metadata
  });

const getOfficialMetadataFields = () =>
  get("/metadata/official_metadata_fields");

// Bulk-upload samples (both local and remote), with metadata.
const bulkUploadWithMetadata = (samples, metadata) =>
  postWithCSRF(`/samples/bulk_upload_with_metadata.json`, {
    samples,
    metadata,
    client: "web"
  });

export {
  bulkUploadWithMetadata,
  getOfficialMetadataFields,
  getSampleMetadata,
  getSampleMetadataFields,
  getProjectMetadataFields,
  saveSampleMetadata,
  uploadMetadataForProject,
  validateMetadataCSVForProject,
  validateMetadataCSVForNewSamples,
  validateManualMetadataForProject,
  validateManualMetadataForNewSamples
};
