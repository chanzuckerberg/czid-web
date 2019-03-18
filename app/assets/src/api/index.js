// TODO(mark): Split this file up as more API methods get added.
// TODO(tiago): Consolidate the way we accept input parameters
import axios from "axios";
import { cleanFilePath } from "~utils/sample";
import { set } from "lodash/fp";

const postWithCSRF = async (url, params) => {
  try {
    const resp = await axios.post(url, {
      ...params,
      // Fetch the CSRF token from the DOM.
      authenticity_token: document.getElementsByName("csrf-token")[0].content
    });

    // Just return the data.
    // resp also contains headers, status, etc. that we might use later.
    return resp.data;
  } catch (error) {
    return Promise.reject(error);
  }
};

// TODO(mark): Remove redundancy in CSRF methods.
const putWithCSRF = async (url, params) => {
  try {
    const resp = await axios.put(url, {
      ...params,
      // Fetch the CSRF token from the DOM.
      authenticity_token: document.getElementsByName("csrf-token")[0].content
    });

    // Just return the data.
    // resp also contains headers, status, etc. that we might use later.
    return resp.data;
  } catch (e) {
    return Promise.reject(e.response.data);
  }
};

const get = async (url, config) => {
  try {
    const resp = await axios.get(url, config);

    return resp.data;
  } catch (e) {
    return Promise.reject(e.response.data);
  }
};

const deleteAsync = async (url, config) => {
  const resp = await axios.delete(url, config);

  return resp.data;
};

const deleteWithCSRF = async url => {
  try {
    const resp = await axios.delete(url, {
      data: {
        // Fetch the CSRF token from the DOM.
        authenticity_token: document.getElementsByName("csrf-token")[0].content
      }
    });

    return resp.data;
  } catch (e) {
    return Promise.reject(e.response.data);
  }
};

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

const getMetadataTypesByHostGenomeName = () =>
  get("/samples/metadata_types_by_host_genome_name");

// Save fields on the sample model (NOT sample metadata)
const saveSampleField = (id, field, value) =>
  postWithCSRF(`/samples/${id}/save_metadata`, {
    field,
    value
  });

const saveSampleName = (id, name) => saveSampleField(id, "name", name);

const saveSampleNotes = (id, sampleNotes) =>
  saveSampleField(id, "sample_notes", sampleNotes);

const getAlignmentData = (sampleId, alignmentQuery, pipelineVersion) =>
  get(
    `/samples/${sampleId}/alignment_viz/${alignmentQuery}.json?pipeline_version=${pipelineVersion}`
  );

const deleteSample = id => deleteWithCSRF(`/samples/${id}.json`);

const getSampleReportInfo = (id, params) =>
  get(`/samples/${id}/report_info${params}`);

const getSummaryContigCounts = (id, minContigSize) =>
  get(`/samples/${id}/summary_contig_counts?min_contig_size=${minContigSize}`);

// TODO(mark): Remove this method once we launch the new sample upload flow.
// Send a request to create a single sample. Does not upload the files.
// sourceType can be "local" or "s3".
const createSample = (
  sampleName,
  projectName,
  hostId,
  inputFiles,
  sourceType,
  preloadResultsPath = "",
  alignmentConfig = "",
  pipelineBranch = "",
  dagVariables = "{}",
  maxInputFragments = "",
  subsample = ""
) => {
  const fileAttributes = Array.from(inputFiles, file => {
    if (sourceType === "local") {
      return {
        source_type: sourceType,
        source: cleanFilePath(file.name),
        parts: cleanFilePath(file.name)
      };
    } else {
      return {
        source_type: sourceType,
        source: file
      };
    }
  });

  return postWithCSRF("/samples.json", {
    sample: {
      name: sampleName,
      project_name: projectName,
      host_genome_id: hostId,
      input_files_attributes: fileAttributes,
      status: "created",
      client: "web",

      // Admin options
      s3_preload_result_path: preloadResultsPath,
      alignment_config_name: alignmentConfig,
      pipeline_branch: pipelineBranch,
      dag_vars: dagVariables,
      max_input_fragments: maxInputFragments,
      subsample: subsample
    }
  });
};

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

const getAllHostGenomes = () => get("/host_genomes.json");

// TODO(mark): Remove this method once we launch the new sample upload flow.
const bulkUploadRemoteSamples = samples =>
  postWithCSRF(`/samples/bulk_upload.json`, {
    samples
  });

// Bulk-upload samples that have files in an S3 bucket, with metadata.
const bulkUploadWithMetadata = (samples, metadata) =>
  postWithCSRF(`/samples/bulk_upload_with_metadata.json`, {
    samples,
    metadata,
    client: "web"
  });

const saveVisualization = (type, data) =>
  postWithCSRF(`/visualizations/${type}/save`, {
    type,
    data
  });

const shortenUrl = url => postWithCSRF("/visualizations/shorten_url", { url });

const bulkImportRemoteSamples = ({ projectId, hostGenomeId, bulkPath }) =>
  get("/samples/bulk_import.json", {
    params: {
      project_id: projectId,
      host_genome_id: hostGenomeId,
      bulk_path: bulkPath
    }
  });

const markSampleUploaded = sampleId =>
  putWithCSRF(`/samples/${sampleId}.json`, {
    sample: {
      id: sampleId,
      status: "uploaded"
    }
  });

const uploadFileToUrl = async (
  file,
  url,
  { onUploadProgress, onSuccess, onError }
) => {
  const config = {
    onUploadProgress
  };

  return axios
    .put(url, file, config)
    .then(onSuccess)
    .catch(onError);
};

const getTaxonDescriptions = taxonList =>
  get(`/taxon_descriptions.json?taxon_list=${taxonList.join(",")}`);

const getTaxonDistributionForBackground = (backgroundId, taxonId) =>
  get(`/backgrounds/${backgroundId}/show_taxon_dist.json?taxid=${taxonId}`);

const getSampleTaxons = (params, cancelToken) =>
  get("/visualizations/samples_taxons.json", {
    params,
    cancelToken
  });

// TODO(tiago): still needs to accepts field to sort by
const getSamples = ({
  projectId,
  domain,
  limit,
  offset,
  filters,
  listAllIds
} = {}) => {
  return get("/samples/index_v2.json", {
    params: {
      projectId,
      domain,
      limit,
      offset,
      listAllIds,
      ...filters
    }
  });
};

const getSampleDimensions = ({ domain }) =>
  get("/samples/dimensions.json", {
    params: {
      domain
    }
  });

const getProjectDimensions = ({ domain }) =>
  get("/projects/dimensions.json", {
    params: {
      domain
    }
  });

const getSamplesV1 = params => get("/samples.json", { params });

const getProjects = ({ domain, filters } = {}) =>
  get("/projects.json", {
    params: {
      domain,
      ...filters
    }
  });

const getVisualizations = ({ domain, filters } = {}) =>
  get("/visualizations.json", {
    params: {
      domain,
      ...filters
    }
  });

const createProject = params =>
  postWithCSRF("/projects.json", {
    project: params
  });

const logAnalyticsEvent = (eventName, eventData = {}) => {
  // Wrapper around Segment analytics so we can add things later
  // eventData should have keys in snake_case for the database
  if (window.analytics) window.analytics.track(eventName, eventData);
};

const validateSampleNames = (projectId, sampleNames) => {
  if (!projectId) {
    return Promise.resolve(sampleNames);
  }

  return postWithCSRF(`/projects/${projectId}/validate_sample_names`, {
    sample_names: sampleNames
  });
};

const validateSampleFiles = sampleFiles => {
  if (!sampleFiles || sampleFiles.length == 0) {
    return Promise.resolve(sampleFiles);
  }

  return postWithCSRF(`/samples/validate_sample_files`, {
    sample_files: sampleFiles
  });
};

const getSearchSuggestions = ({ categories, query }) =>
  get("/search_suggestions", {
    params: {
      categories,
      query
    }
  });

const createBackground = ({ description, name, sampleIds }) =>
  postWithCSRF("/backgrounds", {
    name,
    description,
    sample_ids: sampleIds
  });

export {
  bulkImportRemoteSamples,
  bulkUploadRemoteSamples,
  bulkUploadWithMetadata,
  createBackground,
  createProject,
  createSample,
  deleteAsync,
  deleteSample,
  get,
  getAlignmentData,
  getAllHostGenomes,
  getMetadataTypesByHostGenomeName,
  getOfficialMetadataFields,
  getProjectDimensions,
  getProjects,
  getSampleDimensions,
  getSampleMetadata,
  getSampleMetadataFields,
  getProjectMetadataFields,
  getSampleReportInfo,
  getSampleTaxons,
  getSamples,
  getSamplesV1,
  getSearchSuggestions,
  getSummaryContigCounts,
  getTaxonDescriptions,
  getTaxonDistributionForBackground,
  getVisualizations,
  logAnalyticsEvent,
  markSampleUploaded,
  saveSampleMetadata,
  saveSampleName,
  saveSampleNotes,
  saveVisualization,
  shortenUrl,
  uploadMetadataForProject,
  uploadFileToUrl,
  validateManualMetadataForProject,
  validateManualMetadataForNewSamples,
  validateMetadataCSVForNewSamples,
  validateMetadataCSVForProject,
  validateSampleNames,
  validateSampleFiles
};
