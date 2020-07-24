// This file contains unsorted API endpoints.
// TODO(mark): Split this file up as more API methods get added.
// TODO(tiago): Consolidate the way we accept input parameters
import axios from "axios";
import axiosRetry from "axios-retry";

import { getURLParamString } from "~/helpers/url";

import { get, postWithCSRF, putWithCSRF, deleteWithCSRF } from "./core";

// Save fields on the sample model (NOT sample metadata)
const saveSampleField = (id, field, value) =>
  postWithCSRF(`/samples/${id}/save_metadata`, {
    field,
    value,
  });

const saveSampleName = (id, name) => saveSampleField(id, "name", name);

const saveSampleNotes = (id, sampleNotes) =>
  saveSampleField(id, "sample_notes", sampleNotes);

const getAlignmentData = (sampleId, alignmentQuery, pipelineVersion) =>
  get(
    `/samples/${sampleId}/alignment_viz/${alignmentQuery}.json?pipeline_version=${pipelineVersion}`
  );

const deleteSample = id => deleteWithCSRF(`/samples/${id}.json`);

const getSampleReportData = ({
  snapshotShareId,
  sampleId,
  background,
  pipelineVersion,
}) =>
  get(
    (snapshotShareId ? `/pub/${snapshotShareId}` : "") +
      `/samples/${sampleId}/report_v2.json?background=${background}&pipeline_version=${pipelineVersion}`
  );

const getSampleReportInfo = (id, params) =>
  get(`/samples/${id}/report_info${params}`);

const getSummaryContigCounts = (id, minContigReads) =>
  get(
    `/samples/${id}/summary_contig_counts?min_contig_reads=${minContigReads}`
  );

const getAllHostGenomes = () => get("/host_genomes.json");

const getAllSampleTypes = () => get("/sample_types.json");

const saveVisualization = (type, data) =>
  postWithCSRF(`/visualizations/${type}/save`, {
    type,
    data,
  });

const shortenUrl = url => postWithCSRF("/visualizations/shorten_url", { url });

const bulkImportRemoteSamples = ({ projectId, hostGenomeId, bulkPath }) =>
  get("/samples/bulk_import.json", {
    params: {
      project_id: projectId,
      host_genome_id: hostGenomeId,
      bulk_path: bulkPath,
    },
  });

const markSampleUploaded = sampleId =>
  putWithCSRF(`/samples/${sampleId}.json`, {
    sample: {
      id: sampleId,
      status: "uploaded",
    },
  });

const uploadFileToUrl = async (
  file,
  url,
  { onUploadProgress, onSuccess, onError }
) => {
  const config = {
    onUploadProgress,
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
    onUploadProgress,
  };

  // Retry up to 5 times with a 30s delay. axiosRetry interceptor means that 'catch' won't be
  // called until all tries fail.
  const client = axios.create();
  axiosRetry(client, {
    retries: 5,
    retryDelay: () => 30000,
    retryCondition: () => true,
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
    cancelToken,
  });

// TODO(tiago): still needs to accepts field to sort by
const getSamples = ({
  projectId,
  search,
  domain,
  limit,
  offset,
  filters,
  listAllIds,
  sampleIds,
  basic = false,
} = {}) =>
  get("/samples/index_v2.json", {
    params: {
      projectId,
      search,
      domain,
      limit,
      offset,
      listAllIds,
      basic, // if true, then don't include extra details (ex: metadata) for each sample
      // &sampleIds=[1,2] instead of default &sampleIds[]=1&sampleIds[]=2 format.
      sampleIds: JSON.stringify(sampleIds),
      ...filters,
    },
  });

const getSampleDimensions = ({ domain, filters, projectId, search }) =>
  get("/samples/dimensions.json", {
    params: {
      domain,
      projectId,
      search,
      ...filters,
    },
  });

const getSampleStats = ({ domain, filters, projectId, search }) =>
  get("/samples/stats.json", {
    params: {
      domain,
      projectId,
      search,
      ...filters,
    },
  });

const getSample = ({ snapshotShareId, sampleId }) =>
  get(
    (snapshotShareId ? `/pub/${snapshotShareId}` : "") +
      `/samples/${sampleId}.json`
  );

const getProjectDimensions = ({ domain, filters, projectId, search }) =>
  get("/projects/dimensions.json", {
    params: {
      domain,
      search,
      projectId,
      ...filters,
    },
  });

const getSamplesV1 = params => get("/samples.json", { params });

const getProject = ({ projectId }) => get(`/projects/${projectId}.json`);

const getProjects = ({
  basic,
  domain,
  filters,
  limit,
  listAllIds,
  offset,
  search,
  projectId,
} = {}) =>
  get("/projects.json", {
    params: {
      basic,
      domain,
      limit,
      listAllIds,
      offset,
      search,
      projectId,
      ...filters,
    },
  });

const getVisualizations = ({ domain, filters, search } = {}) =>
  get("/visualizations.json", {
    params: {
      domain,
      search,
      ...filters,
    },
  });

const createProject = params =>
  postWithCSRF("/projects.json", {
    project: params,
  });

const saveProjectDescription = (projectId, description) =>
  putWithCSRF(`/projects/${projectId}.json`, {
    description: description,
  });

const validateSampleNames = (projectId, sampleNames) => {
  if (!projectId) {
    return Promise.resolve(sampleNames);
  }

  return postWithCSRF(`/projects/${projectId}/validate_sample_names`, {
    sample_names: sampleNames,
  });
};

const validateSampleFiles = sampleFiles => {
  if (!sampleFiles || sampleFiles.length === 0) {
    return Promise.resolve(sampleFiles);
  }

  return postWithCSRF(`/samples/validate_sample_files`, {
    sample_files: sampleFiles,
  });
};

const getSearchSuggestions = ({ categories, query, domain }) =>
  get("/search_suggestions", {
    params: {
      categories,
      query,
      domain,
    },
  });

const createBackground = ({ description, name, sampleIds, massNormalized }) =>
  postWithCSRF("/backgrounds", {
    name,
    description,
    sample_ids: sampleIds,
    mass_normalized: massNormalized || null,
  });

const getBackgrounds = async snapshotShareId => {
  const response = await get(
    (snapshotShareId ? "/pub" : "") + "/backgrounds.json"
  );
  return response.backgrounds;
};

const getCoverageVizSummary = sampleId =>
  get(`/samples/${sampleId}/coverage_viz_summary`);

const getCoverageVizData = (sampleId, accessionId) =>
  get(`/samples/${sampleId}/coverage_viz_data?accessionId=${accessionId}`);

const getContigsSequencesByByteranges = (
  sampleId,
  byteranges,
  pipelineVersion
) => {
  const params = getURLParamString({
    byteranges: byteranges.map(byterange => byterange.join(",")),
    pipelineVersion,
  });
  return get(`/samples/${sampleId}/contigs_sequences_by_byteranges?${params}`);
};

const getPhyloTree = id => get(`/phylo_trees/${id}/show.json`);

const validatePhyloTreeName = name =>
  get(`/phylo_trees/validate_name?name=${name}`);

const getSamplesLocations = ({ domain, filters, projectId, search }) =>
  get("/locations/sample_locations.json", {
    params: {
      domain,
      search,
      projectId,
      ...filters,
    },
  });

const getSamplePipelineResults = (sampleId, pipelineVersion) =>
  get(`/samples/${sampleId}/results_folder.json`, {
    params: {
      pipeline_version: pipelineVersion,
    },
  });

// Get autocomplete suggestions for "taxa that have reads" for a set of samples.
const getTaxaWithReadsSuggestions = (query, sampleIds, taxLevel) =>
  postWithCSRF("/samples/taxa_with_reads_suggestions.json", {
    query,
    sampleIds,
    taxLevel,
  });

// Get autocomplete suggestions for "taxa that have contigs" for a set of samples.
const getTaxaWithContigsSuggestions = (query, sampleIds) =>
  postWithCSRF("/samples/taxa_with_contigs_suggestions.json", {
    query,
    sampleIds,
  });

const uploadedByCurrentUser = async sampleIds => {
  const response = await postWithCSRF("samples/uploaded_by_current_user", {
    sampleIds,
  });

  return response.uploaded_by_current_user;
};

const getHeatmapMetrics = () => get("/visualizations/heatmap_metrics.json");

const getUserSettingMetadataByCategory = () =>
  get("/user_settings/metadata_by_category");

const updateUserSetting = (key, value) =>
  postWithCSRF("user_settings/update", {
    key,
    value,
  });

const getTaxaDetails = params =>
  postWithCSRF("/visualizations/taxa_details.json", {
    sampleIds: params.sampleIds,
    taxonIds: params.taxonIds,
    removedTaxonIds: params.removedTaxonIds,
    updateBackgroundOnly: params.updateBackgroundOnly,
    background: params.background,
  });

const getMassNormalizedBackgroundAvailability = sampleIds =>
  postWithCSRF("/samples/enable_mass_normalized_backgrounds.json", {
    sampleIds,
  });

export {
  bulkImportRemoteSamples,
  createBackground,
  createProject,
  deleteSample,
  getAlignmentData,
  getAllHostGenomes,
  getAllSampleTypes,
  getContigsSequencesByByteranges,
  getCoverageVizData,
  getCoverageVizSummary,
  getHeatmapMetrics,
  getPhyloTree,
  getProject,
  getProjectDimensions,
  getProjects,
  getSample,
  getSampleDimensions,
  getMassNormalizedBackgroundAvailability,
  getSampleReportData,
  getSampleReportInfo,
  getSamples,
  getSamplesLocations,
  getSampleStats,
  getSamplesV1,
  getSampleTaxons,
  getSamplePipelineResults,
  getSearchSuggestions,
  getSummaryContigCounts,
  getTaxonDescriptions,
  getTaxonDistributionForBackground,
  getUserSettingMetadataByCategory,
  getVisualizations,
  markSampleUploaded,
  saveProjectDescription,
  saveSampleName,
  saveSampleNotes,
  saveVisualization,
  shortenUrl,
  uploadFileToUrl,
  uploadFileToUrlWithRetries,
  validatePhyloTreeName,
  validateSampleFiles,
  validateSampleNames,
  getBackgrounds,
  getTaxaWithReadsSuggestions,
  getTaxaWithContigsSuggestions,
  uploadedByCurrentUser,
  updateUserSetting,
  getTaxaDetails,
};
