// This file contains unsorted API endpoints.
// TODO(mark): Split this file up as more API methods get added.
// TODO(tiago): Consolidate the way we accept input parameters
import axios from "axios";

import { getURLParamString } from "~/helpers/url";

import {
  get,
  postWithCSRF,
  putWithCSRF,
  deleteWithCSRF,
  MAX_SAMPLES_FOR_GET_REQUEST,
} from "./core";

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
    `/samples/${sampleId}/alignment_viz/${alignmentQuery}.json?pipeline_version=${pipelineVersion}`,
  );

const deleteSample = id => deleteWithCSRF(`/samples/${id}.json`);

const getSampleReportData = ({
  snapshotShareId = null,
  sampleId,
  background,
  pipelineVersion = null,
  mergeNtNr = false,
}) =>
  get(
    (snapshotShareId ? `/pub/${snapshotShareId}` : "") +
      `/samples/${sampleId}/report_v2.json?`,
    {
      params: {
        id: sampleId,
        pipeline_version: pipelineVersion,
        background: background,
        merge_nt_nr: mergeNtNr,
      },
    },
  );

const getSummaryContigCounts = (id, minContigReads) =>
  get(
    `/samples/${id}/summary_contig_counts?min_contig_reads=${minContigReads}`,
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
  { onUploadProgress, onSuccess, onError },
) => {
  const config = {
    onUploadProgress,
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
  orderBy,
  orderDir,
  sampleIds,
  snapshotShareId,
  basic = false,
  workflow,
} = {}) =>
  get(
    (snapshotShareId ? `/pub/${snapshotShareId}` : "") +
      "/samples/index_v2.json",
    {
      params: {
        projectId,
        search,
        domain,
        limit,
        offset,
        orderBy,
        orderDir,
        listAllIds,
        snapshotShareId,
        basic, // if true, then don't include extra details (ex: metadata) for each sample
        // &sampleIds=[1,2] instead of default &sampleIds[]=1&sampleIds[]=2 format.
        sampleIds: JSON.stringify(sampleIds),
        workflow,
        ...filters,
      },
    },
  );

const getWorkflowRuns = ({
  projectId,
  domain,
  filters,
  search,
  mode = "with_sample_info",
  listAllIds,
  orderBy,
  orderDir,
  limit,
  offset,
} = {}) =>
  get("/workflow_runs.json", {
    params: {
      projectId,
      domain,
      listAllIds,
      search,
      mode,
      orderBy,
      orderDir,
      limit,
      offset,
      ...filters,
    },
  });

const getSampleDimensions = ({
  domain,
  filters,
  projectId,
  snapshotShareId,
  search,
  sampleIds,
}) =>
  get(
    (snapshotShareId ? `/pub/${snapshotShareId}` : "") +
      "/samples/dimensions.json",
    {
      params: {
        domain,
        projectId,
        snapshotShareId,
        search,
        sampleIds,
        ...filters,
      },
    },
  );

const getSampleStats = ({
  domain,
  filters,
  projectId,
  snapshotShareId,
  search,
  sampleIds,
}) =>
  get(
    (snapshotShareId ? `/pub/${snapshotShareId}` : "") + "/samples/stats.json",
    {
      params: {
        domain,
        projectId,
        snapshotShareId,
        search,
        sampleIds: JSON.stringify(sampleIds),
        ...filters,
      },
    },
  );

const getSample = ({ snapshotShareId, sampleId }) =>
  get(
    (snapshotShareId ? `/pub/${snapshotShareId}` : "") +
      `/samples/${sampleId}.json`,
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

const getProjects = ({
  basic,
  domain,
  filters,
  limit,
  listAllIds,
  offset,
  orderBy,
  orderDir,
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
      orderBy,
      orderDir,
      search,
      projectId,
      ...filters,
    },
  });

const getVisualizations = ({
  domain,
  filters,
  search,
  orderBy,
  orderDir,
} = {}) =>
  get("/visualizations.json", {
    params: {
      domain,
      search,
      orderBy,
      orderDir,
      ...filters,
    },
  });

const createProject = params =>
  postWithCSRF("/projects.json", {
    project: params,
  });

const saveProjectName = (projectId, projectName) =>
  putWithCSRF(`/projects/${projectId}.json`, {
    name: projectName,
  });

const validateProjectName = (projectId, projectName) =>
  get(`/projects/${projectId}/validate_project_name.json`, {
    params: { name: projectName },
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

const getBackgrounds = ({
  snapshotShareId,
  ownedOrPublicBackgroundsOnly,
  categorizeBackgrounds,
} = {}) =>
  get(
    (snapshotShareId ? `/pub/${snapshotShareId}` : "") + "/backgrounds.json",
    {
      params: {
        ownedOrPublicBackgroundsOnly,
        ...(!snapshotShareId && { categorizeBackgrounds }),
      },
    },
  );

const getCoverageVizSummary = ({ sampleId, snapshotShareId } = {}) =>
  get(
    (snapshotShareId ? `/pub/${snapshotShareId}` : "") +
      `/samples/${sampleId}/coverage_viz_summary`,
  );

const getCoverageVizData = ({ sampleId, accessionId, snapshotShareId } = {}) =>
  get(
    (snapshotShareId ? `/pub/${snapshotShareId}` : "") +
      `/samples/${sampleId}/coverage_viz_data?accessionId=${accessionId}`,
  );

const getWorkflowRunsInfo = workflowRunIds =>
  postWithCSRF("/workflow_runs/workflow_runs_info", { workflowRunIds });

const getWorkflowRunResults = workflowRunId =>
  get(`/workflow_runs/${workflowRunId}/results`);

const getContigsSequencesByByteranges = (
  sampleId,
  byteranges,
  pipelineVersion,
) => {
  const params = getURLParamString({
    byteranges: byteranges.map(byterange => byterange.join(",")),
    pipelineVersion,
  });
  return get(`/samples/${sampleId}/contigs_sequences_by_byteranges?${params}`);
};

const createPhyloTree = ({ treeName, projectId, taxId, pipelineRunIds }) => {
  return postWithCSRF("/phylo_tree_ngs.json", {
    name: treeName,
    projectId,
    taxId,
    pipelineRunIds,
  });
};

const getPhyloTree = id => get(`/phylo_trees/${id}/show.json`);

const getPhyloTrees = ({ taxId, projectId, nextGeneration = false } = {}) => {
  const endpoint = nextGeneration
    ? "/phylo_tree_ngs.json"
    : "/phylo_trees/index.json";

  return get(endpoint, {
    params: {
      taxId,
      projectId,
    },
  });
};

const getNewPhyloTreePipelineRunIds = ({
  getAdditionalSamples,
  projectId,
  taxId,
  filter,
}) => {
  return get("/phylo_tree_ngs/new_pr_ids.json", {
    params: {
      getAdditionalSamples,
      projectId,
      taxId,
      filter,
    },
  });
};

const getNewPhyloTreePipelineRunInfo = ({
  getAdditionalSamples,
  pipelineRunIds,
  taxId,
}) => {
  return get("/phylo_tree_ngs/new_pr_info.json", {
    params: {
      getAdditionalSamples,
      pipelineRunIds,
      taxId,
    },
  });
};

// Consider consolidating with ProjectsController#index:
const getProjectsToChooseFrom = () => get("/choose_project.json");

const validatePhyloTreeName = ({ treeName }) => {
  return get("/phylo_tree_ngs/validate_name", { params: { name: treeName } });
};

const retryPhyloTree = id => postWithCSRF("/phylo_trees/retry", { id });

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

// Limits requests to MAX_SAMPLES_FOR_GET_REQUEST samples at a time, per Puma limits.
const getSamplesReadStats = async sampleIds => {
  if (!Array.isArray(sampleIds) || sampleIds.length < 1) {
    return {};
  }
  const binLength = MAX_SAMPLES_FOR_GET_REQUEST;
  const fetchBins = [[]];
  let binIndex = 0;
  sampleIds.forEach((sampleId, index) => {
    if (index % binLength === 0 && index > 0) {
      fetchBins.push([]);
      binIndex += 1;
    }
    fetchBins[binIndex].push(sampleId);
  });

  const requests = fetchBins.map(bin =>
    get("/samples/reads_stats.json", {
      params: {
        sampleIds: bin,
      },
    }),
  );

  const response = await Promise.all(requests);
  // flatten into one object
  const result = response.flat().reduce((accum, current) => {
    return Object.assign(accum, current);
  }, {});
  return result;
};

const setWorkflowVersion = (workflowName, version) =>
  putWithCSRF("/app_config", {
    app_config: {
      key: workflowName,
      value: version,
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

const samplesUploadedByCurrentUser = async sampleIds => {
  const {
    uploaded_by_current_user: allSamplesUploadedByCurrentUser,
  } = await postWithCSRF("samples/uploaded_by_current_user", {
    sampleIds,
  });

  return allSamplesUploadedByCurrentUser;
};

const workflowRunsCreatedByCurrentUser = async workflowRunIds => {
  const {
    created_by_current_user: allWorkflowRunsCreatedByCurrentUser,
  } = await postWithCSRF("workflow_runs/created_by_current_user", {
    workflowRunIds,
  });

  return allWorkflowRunsCreatedByCurrentUser;
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
    presets: params.presets,
  });

const getMassNormalizedBackgroundAvailability = sampleIds =>
  postWithCSRF("/samples/enable_mass_normalized_backgrounds.json", {
    sampleIds,
  });

const createConsensusGenomeCladeExport = ({
  workflowRunIds = [],
  referenceTree,
}) =>
  postWithCSRF("/workflow_runs/consensus_genome_clade_export", {
    workflowRunIds,
    referenceTree,
  });

const kickoffConsensusGenome = ({
  sampleId,
  workflow,
  accessionId,
  accessionName,
  taxonId,
  taxonName,
  technology,
}) =>
  postWithCSRF(`/samples/${sampleId}/kickoff_workflow`, {
    workflow,
    inputs_json: {
      accession_id: accessionId,
      accession_name: accessionName,
      taxon_id: taxonId,
      taxon_name: taxonName,
      technology,
    },
  });

const kickoffAMR = ({ sampleId, workflow }) =>
  postWithCSRF(`/samples/${sampleId}/kickoff_workflow`, {
    workflow,
  });

export {
  bulkImportRemoteSamples,
  createBackground,
  createConsensusGenomeCladeExport,
  createPhyloTree,
  createProject,
  deleteSample,
  getAlignmentData,
  getAllHostGenomes,
  getAllSampleTypes,
  getBackgrounds,
  getContigsSequencesByByteranges,
  getCoverageVizData,
  getCoverageVizSummary,
  getHeatmapMetrics,
  getMassNormalizedBackgroundAvailability,
  getNewPhyloTreePipelineRunIds,
  getNewPhyloTreePipelineRunInfo,
  getPhyloTree,
  getPhyloTrees,
  getProjectDimensions,
  getProjects,
  getProjectsToChooseFrom,
  getSample,
  getSampleDimensions,
  getSamplePipelineResults,
  getSampleReportData,
  getSamples,
  getSamplesLocations,
  getSamplesReadStats,
  getSampleStats,
  getSampleTaxons,
  getSearchSuggestions,
  getSummaryContigCounts,
  getTaxaDetails,
  getTaxaWithContigsSuggestions,
  getTaxaWithReadsSuggestions,
  getTaxonDescriptions,
  getTaxonDistributionForBackground,
  getUserSettingMetadataByCategory,
  getVisualizations,
  getWorkflowRuns,
  getWorkflowRunsInfo,
  getWorkflowRunResults,
  kickoffConsensusGenome,
  kickoffAMR,
  markSampleUploaded,
  retryPhyloTree,
  saveProjectDescription,
  saveProjectName,
  saveSampleName,
  saveSampleNotes,
  saveVisualization,
  setWorkflowVersion,
  shortenUrl,
  updateUserSetting,
  samplesUploadedByCurrentUser,
  uploadFileToUrl,
  validatePhyloTreeName,
  validateProjectName,
  validateSampleFiles,
  validateSampleNames,
  workflowRunsCreatedByCurrentUser,
};
