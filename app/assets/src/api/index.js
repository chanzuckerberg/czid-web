// This file contains unsorted API endpoints.
// TODO(mark): Split this file up as more API methods get added.
// TODO(tiago): Consolidate the way we accept input parameters
import axios from "axios";
import axiosRetry from "axios-retry";
import { cleanFilePath } from "~utils/sample";

import { get, postWithCSRF, putWithCSRF, deleteWithCSRF } from "./core";

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

const getAllHostGenomes = () => get("/host_genomes.json");

// TODO(mark): Remove this method once we launch the new sample upload flow.
const bulkUploadRemoteSamples = samples =>
  postWithCSRF(`/samples/bulk_upload.json`, {
    samples
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

// Upload with retries with more resilient settings (e.g. for sample uploads)
const uploadFileToUrlWithRetries = async (
  file,
  url,
  { onUploadProgress, onSuccess, onError }
) => {
  const config = {
    onUploadProgress
  };

  // Retry up to 5 times with a 30s delay. axiosRetry interceptor means that 'catch' won't be
  // called until all tries fail.
  const client = axios.create();
  axiosRetry(client, {
    retries: 5,
    retryDelay: () => 30000,
    retryCondition: () => true
  });

  return client
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
  search,
  domain,
  limit,
  offset,
  filters,
  listAllIds
} = {}) =>
  get("/samples/index_v2.json", {
    params: {
      projectId,
      search,
      domain,
      limit,
      offset,
      listAllIds,
      ...filters
    }
  });

const getSampleDimensions = ({ domain, filters, projectId, search }) =>
  get("/samples/dimensions.json", {
    params: {
      domain,
      projectId,
      search,
      ...filters
    }
  });

const getProjectDimensions = ({ domain, filters, search }) =>
  get("/projects/dimensions.json", {
    params: {
      domain,
      search,
      ...filters
    }
  });

const getSamplesV1 = params => get("/samples.json", { params });

const getProjects = ({ domain, filters, search, basic } = {}) =>
  get("/projects.json", {
    params: {
      domain,
      search,
      basic,
      ...filters
    }
  });

const getVisualizations = ({ domain, filters, search } = {}) =>
  get("/visualizations.json", {
    params: {
      domain,
      search,
      ...filters
    }
  });

const createProject = params =>
  postWithCSRF("/projects.json", {
    project: params
  });

// See https://czi.quip.com/bKDnAITc6CbE/How-to-start-instrumenting-analytics-2019-03-06
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
  createBackground,
  createProject,
  createSample,
  deleteSample,
  getAlignmentData,
  getAllHostGenomes,
  getProjectDimensions,
  getProjects,
  getSampleDimensions,
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
  saveSampleName,
  saveSampleNotes,
  saveVisualization,
  shortenUrl,
  uploadFileToUrl,
  uploadFileToUrlWithRetries,
  validateSampleNames,
  validateSampleFiles
};
