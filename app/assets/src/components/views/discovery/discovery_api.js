import { get, map, toLower, toUpper, replace } from "lodash/fp";
import {
  getProjectDimensions,
  getProjects,
  getSampleDimensions,
  getSampleStats,
  getSamples,
  getSamplesLocations,
  getVisualizations,
  getWorkflowRuns,
} from "~/api";
import { WORKFLOWS } from "~/components/utils/workflows";
import { numberWithPlusOrMinus } from "~/helpers/strings";

const DISCOVERY_DOMAIN_MY_DATA = "my_data";
const DISCOVERY_DOMAIN_ALL_DATA = "all_data";
const DISCOVERY_DOMAIN_PUBLIC = "public";
const DISCOVERY_DOMAIN_SNAPSHOT = "snapshot";

const DISCOVERY_DOMAINS = [
  DISCOVERY_DOMAIN_ALL_DATA,
  DISCOVERY_DOMAIN_MY_DATA,
  DISCOVERY_DOMAIN_PUBLIC,
  DISCOVERY_DOMAIN_SNAPSHOT,
];

const getDiscoveryDimensions = async ({
  domain,
  filters,
  projectId,
  snapshotShareId,
  search,
  sampleIds,
}) => {
  try {
    const actions = [
      getSampleDimensions({
        domain,
        filters,
        projectId,
        snapshotShareId,
        search,
        sampleIds,
      }),
    ];
    if (!snapshotShareId)
      actions.push(
        getProjectDimensions({ domain, filters, projectId, search }),
      );
    const [sampleDimensions, projectDimensions] = await Promise.all(actions);
    return { sampleDimensions, projectDimensions };
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(error);
    return {};
  }
};

const getDiscoveryStats = async ({
  domain,
  filters,
  projectId,
  snapshotShareId,
  search,
  sampleIds,
}) => {
  try {
    const sampleStats = await getSampleStats({
      domain,
      filters,
      projectId,
      snapshotShareId,
      search,
      sampleIds,
    });
    return { sampleStats };
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(error);
    return {};
  }
};

const processRawSample = sample => {
  const meanInsertSize = get(
    "derived_sample_output.summary_stats.insert_size_mean",
    sample.details,
  );
  const insertSizeStandardDeviation = get(
    "derived_sample_output.summary_stats.insert_size_standard_deviation",
    sample.details,
  );
  const meanInsertSizeString = numberWithPlusOrMinus(
    meanInsertSize,
    insertSizeStandardDeviation,
  );

  const row = {
    sample: {
      initialWorkflow: get("db_sample.initial_workflow", sample.details),
      name: sample.name,
      project: get("derived_sample_output.project_name", sample.details),
      publicAccess: !!sample.public,
      pipelineRunStatus: toLower(
        get("mngs_run_info.result_status_description", sample.details),
      ),
      pipelineRunCreatedAt: get("mngs_run_info.created_at", sample.details),
      uploadError: toLower(
        get("upload_error.result_status_description", sample.details),
      ),
      user: get("uploader.name", sample.details),
      userId: get("uploader.id", sample.details),
      workflowRunsCountByWorkflow: get(
        "workflow_runs_count_by_workflow",
        sample.details,
      ),
    },
    createdAt: sample.created_at,
    duplicateCompressionRatio: get(
      "derived_sample_output.summary_stats.compression_ratio",
      sample.details,
    ),
    erccReads: get(
      "derived_sample_output.pipeline_run.total_ercc_reads",
      sample.details,
    ),
    host: get("derived_sample_output.host_genome_name", sample.details),
    id: sample.id,
    meanInsertSize: meanInsertSizeString || "",
    nonHostReads: {
      value: get(
        "derived_sample_output.summary_stats.adjusted_remaining_reads",
        sample.details,
      ),
      percent: get(
        "derived_sample_output.summary_stats.percent_remaining",
        sample.details,
      ),
    },
    notes: get("db_sample.sample_notes", sample.details),
    pipelineVersion: get(
      "derived_sample_output.pipeline_run.pipeline_version",
      sample.details,
    ),
    privateUntil: sample.private_until,
    projectId: sample.project_id,
    qcPercent: get(
      "derived_sample_output.summary_stats.qc_percent",
      sample.details,
    ),
    subsampledFraction: get(
      "derived_sample_output.pipeline_run.fraction_subsampled",
      sample.details,
    ),
    totalReads: get(
      "derived_sample_output.pipeline_run.total_reads",
      sample.details,
    ),
    totalRuntime: get("mngs_run_info.total_runtime", sample.details),
    ...get("metadata", sample.details),
  };
  return row;
};

const formatWetlabProtocol = str => replace(/_/g, " ", toUpper(str));

const processConsensusGenomeWorkflowRun = cgWorkflowRun => {
  const getCachedResult = resultPath =>
    get(["cached_results", ...resultPath], cgWorkflowRun);
  const getInput = inputPath => get(["inputs", ...inputPath], cgWorkflowRun);

  return {
    medakaModel: getInput(["medaka_model"]),
    technology: getInput(["technology"]),
    wetlabProtocol: formatWetlabProtocol(getInput(["wetlab_protocol"])),
    referenceAccession: {
      accessionName: getInput(["accession_name"]),
      referenceAccessionId: getInput(["accession_id"]),
      taxonName: getInput(["taxon_name"]),
    },
    ...(get("cached_results", cgWorkflowRun) && {
      coverageDepth: getCachedResult(["coverage_viz", "coverage_depth"]),
      totalReadsCG: getCachedResult(["quality_metrics", "total_reads"]),
      gcPercent: getCachedResult(["quality_metrics", "gc_percent"]),
      refSnps: getCachedResult(["quality_metrics", "ref_snps"]),
      percentIdentity: getCachedResult(["quality_metrics", "percent_identity"]),
      nActg: getCachedResult(["quality_metrics", "n_actg"]),
      percentGenomeCalled: getCachedResult([
        "quality_metrics",
        "percent_genome_called",
      ]),
      nMissing: getCachedResult(["quality_metrics", "n_missing"]),
      nAmbiguous: getCachedResult(["quality_metrics", "n_ambiguous"]),
      referenceAccessionLength: getCachedResult([
        "quality_metrics",
        "reference_genome_length",
      ]),
      vadrPassFail: getCachedResult(["quality_metrics", "vadr_pass_fail"]),
    }),
  };
};

const processRawWorkflowRun = workflowRun => {
  const getSampleField = path => get(["sample", ...path], workflowRun);

  const workflowRunFields =
    workflowRun.workflow === WORKFLOWS.CONSENSUS_GENOME.value
      ? processConsensusGenomeWorkflowRun(workflowRun)
      : null;

  const row = {
    id: workflowRun.id,
    status: toLower(workflowRun.status),
    createdAt: workflowRun.created_at,
    workflow: workflowRun.workflow,
    sample: {
      id: getSampleField(["info", "id"]),
      name: getSampleField(["info", "name"]),
      createdAt: getSampleField(["info", "created_at"]),
      project: getSampleField(["project_name"]),
      publicAccess: !!getSampleField(["info", "public"]),
      uploadError: toLower(
        getSampleField(["info", "result_status_description"]),
      ),
      user: getSampleField(["uploader", "name"]),
      userId: getSampleField(["uploader", "id"]),
    },
    host: getSampleField(["info", "host_genome_name"]),
    notes: getSampleField(["info", "sample_notes"]),
    privateUntil: getSampleField(["info", "private_until"]),
    projectId: getSampleField(["info", "project_id"]),
    ...workflowRunFields,
    ...getSampleField(["metadata"]),
  };

  return row;
};

const getDiscoverySamples = async ({
  domain,
  filters,
  projectId,
  snapshotShareId,
  search,
  limit = 100,
  offset = 0,
  orderBy,
  orderDir,
  listAllIds = false,
  sampleIds,
} = {}) => {
  const sampleResults = await getSamples({
    domain,
    filters,
    projectId,
    snapshotShareId,
    search,
    limit,
    offset,
    orderBy,
    orderDir,
    listAllIds,
    sampleIds,
    workflow: WORKFLOWS.SHORT_READ_MNGS.value,
  });
  return {
    samples: map(processRawSample, sampleResults.samples),
    sampleIds: sampleResults.all_samples_ids,
  };
};

const getDiscoveryWorkflowRuns = async ({
  domain,
  projectId,
  filters,
  search,
  mode = "with_sample_info",
  listAllIds = false,
  orderBy,
  orderDir,
  limit = 100,
  offset = 0,
}) => {
  const workflowRunsResults = await getWorkflowRuns({
    projectId,
    domain,
    filters,
    search,
    mode,
    listAllIds,
    orderBy,
    orderDir,
    limit,
    offset,
  });

  return {
    workflowRuns: map(processRawWorkflowRun, workflowRunsResults.workflow_runs),
    workflowRunIds: listAllIds
      ? workflowRunsResults.all_workflow_run_ids
      : null,
  };
};

const getDiscoveryProjects = async ({
  domain,
  filters,
  projectId,
  search,
  limit = 100,
  offset = 0,
  orderBy,
  orderDir,
  listAllIds = false,
} = {}) => {
  const projectResults = await getProjects({
    domain,
    filters,
    projectId,
    search,
    limit,
    offset,
    orderBy,
    orderDir,
    listAllIds,
  });
  return {
    projects: projectResults.projects,
    projectIds: projectResults.all_projects_ids,
  };
};

const getDiscoveryVisualizations = async ({
  domain,
  filters,
  search,
  limit = 100,
  offset = 0,
  orderBy,
  orderDir,
  listAllIds = false,
} = {}) => {
  const visualizations = await getVisualizations({
    domain,
    filters,
    search,
    limit,
    offset,
    orderBy,
    orderDir,
    listAllIds,
  });
  return {
    visualizations,
    visualizationIds: listAllIds
      ? visualizations.map(visualization => visualization.id)
      : null,
  };
};

const getDiscoveryLocations = async ({
  domain,
  filters,
  projectId,
  snapshotShareId,
  search,
}) => {
  try {
    return await getSamplesLocations({
      domain,
      filters,
      projectId,
      snapshotShareId,
      search,
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(error);
    return {};
  }
};

export {
  DISCOVERY_DOMAINS,
  DISCOVERY_DOMAIN_MY_DATA,
  DISCOVERY_DOMAIN_ALL_DATA,
  DISCOVERY_DOMAIN_PUBLIC,
  DISCOVERY_DOMAIN_SNAPSHOT,
  getDiscoveryDimensions,
  getDiscoveryLocations,
  getDiscoveryProjects,
  getDiscoverySamples,
  getDiscoveryStats,
  getDiscoveryVisualizations,
  getDiscoveryWorkflowRuns,
};
