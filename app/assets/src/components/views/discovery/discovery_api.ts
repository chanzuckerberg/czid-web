import { get, map, replace, toLower, toUpper } from "lodash/fp";
import {
  getProjectDimensions,
  getProjects,
  getSampleDimensions,
  getSamples,
  getSamplesLocations,
  getSampleStats,
  getVisualizations,
  getWorkflowRuns,
} from "~/api";
import { camelize } from "~/components/utils/objectUtil";
import { WorkflowType } from "~/components/utils/workflows";
import {
  formatSemanticVersion,
  numberWithPlusOrMinus,
} from "~/helpers/strings";

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
}: $TSFixMe) => {
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
}: $TSFixMe) => {
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

const processRawSample = (sample: $TSFixMe) => {
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

  return {
    sample: {
      initialWorkflow: get("db_sample.initial_workflow", sample.details),
      name: sample.name,
      project: get("derived_sample_output.project_name", sample.details),
      publicAccess: !!sample.public,
      pipelineRunStatus: toLower(
        get("mngs_run_info.result_status_description", sample.details),
      ),
      ncbiIndexVersion: get("mngs_run_info.ncbi_index_version", sample.details),
      pipelineRunCreatedAt: get("mngs_run_info.created_at", sample.details),
      pipelineRunFinalized: get("mngs_run_info.finalized", sample.details),
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
};

const formatWetlabProtocol = (str: $TSFixMe) =>
  replace(/_/g, " ", toUpper(str));

const processConsensusGenomeWorkflowRun = (cgWorkflowRun: $TSFixMe) => {
  const getCachedResult = (resultPath: $TSFixMe) =>
    get(["cached_results", ...resultPath], cgWorkflowRun);
  const getInput = (inputPath: $TSFixMe) =>
    get(["inputs", ...inputPath], cgWorkflowRun);

  return {
    medakaModel: getInput(["medaka_model"]),
    technology: getInput(["technology"]),
    creation_source: getInput(["creation_source"]),
    wetlabProtocol: formatWetlabProtocol(getInput(["wetlab_protocol"])),
    referenceAccession: {
      accessionName: getInput(["accession_name"]),
      referenceAccessionId: getInput(["accession_id"]),
      taxonName: getInput(["taxon_name"]),
      taxonId: getInput(["taxon_id"]),
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
    }),
  };
};

const processAmrWorkflowRun = (workflowRun: $TSFixMe) => {
  const qualityMetrics = workflowRun?.cached_results?.quality_metrics;

  const insertSizeMean = qualityMetrics?.insert_size_mean;
  const insertSizeStandardDeviation =
    qualityMetrics?.insert_size_standard_deviation;
  const meanInsertSizeString =
    numberWithPlusOrMinus(insertSizeMean, insertSizeStandardDeviation) || "";

  return {
    ...(qualityMetrics && {
      nonHostReads: {
        value: qualityMetrics.adjusted_remaining_reads,
        percent: qualityMetrics.percent_remaining,
      },
      totalReadsAMR: qualityMetrics.total_reads,
      qcPercent: qualityMetrics.qc_percent,
      duplicateCompressionRatio: qualityMetrics.compression_ratio,
      erccReads: qualityMetrics.total_ercc_reads,
      subsampledFraction: qualityMetrics.fraction_subsampled,
      meanInsertSize: meanInsertSizeString,
    }),
  };
};

const processBenchmarkWorkflowRun = (workflowRun: $TSFixMe) => {
  const benchmarkMetrics = workflowRun?.cached_results?.benchmark_metrics;
  const additionalInfo = camelize(workflowRun?.cached_results?.additional_info);
  const benchmarkInfo = workflowRun?.cached_results?.benchmark_info;

  return {
    aupr: {
      nt: benchmarkMetrics?.nt_aupr,
      nr: benchmarkMetrics?.nr_aupr,
    },
    l2Norm: {
      nt: benchmarkMetrics?.nt_l2_norm,
      nr: benchmarkMetrics?.nr_l2_norm,
    },
    correlation: benchmarkMetrics?.correlation,
    workflowBenchmarked: benchmarkInfo?.workflow,
    groundTruthFile: benchmarkInfo?.ground_truth_file,
    additionalInfo,
  };
};

const processRawWorkflowRun = (workflowRun: $TSFixMe) => {
  const getSampleField = (path: $TSFixMe) =>
    get(["sample", ...path], workflowRun);

  let workflowRunFields = null;

  if (workflowRun.workflow === WorkflowType.CONSENSUS_GENOME) {
    workflowRunFields = processConsensusGenomeWorkflowRun(workflowRun);
  } else if (workflowRun.workflow === WorkflowType.AMR) {
    workflowRunFields = processAmrWorkflowRun(workflowRun);
  } else if (workflowRun.workflow === WorkflowType.BENCHMARK) {
    workflowRunFields = processBenchmarkWorkflowRun(workflowRun);
  }

  return {
    id: workflowRun.id,
    status: toLower(workflowRun.status),
    createdAt: workflowRun.created_at,
    workflow: workflowRun.workflow,
    wdl_version: formatSemanticVersion(workflowRun.wdl_version),
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
      userNameWhoInitiatedWorkflowRun: workflowRun?.runner?.name,
      userIdWhoInitiatedWorkflowRun: workflowRun?.runner?.id,
    },
    host: getSampleField(["info", "host_genome_name"]),
    notes: getSampleField(["info", "sample_notes"]),
    privateUntil: getSampleField(["info", "private_until"]),
    projectId: getSampleField(["info", "project_id"]),
    ...workflowRunFields,
    // @ts-expect-error ts-migrate(2698) FIXME: Spread types may only be created from object types... Remove this comment to see the full error message
    ...getSampleField(["metadata"]),
  };
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
  workflow,
}: $TSFixMe = {}) => {
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
    workflow,
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
}: $TSFixMe) => {
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
}: $TSFixMe = {}) => {
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
}: $TSFixMe = {}) => {
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
      ? visualizations.map((visualization: $TSFixMe) => visualization.id)
      : null,
  };
};

const getDiscoveryLocations = async ({
  domain,
  filters,
  projectId,
  snapshotShareId,
  search,
}: $TSFixMe) => {
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
