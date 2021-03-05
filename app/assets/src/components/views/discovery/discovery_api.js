import { get, map, mapValues, toLower, upperCase } from "lodash/fp";
import { numberWithPlusOrMinus } from "~/helpers/strings";
import {
  getProjectDimensions,
  getProjects,
  getSampleDimensions,
  getSampleStats,
  getSamples,
  getSamplesLocations,
  getVisualizations,
} from "~/api";
import { WORKFLOWS } from "~/components/utils/workflows";

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
        getProjectDimensions({ domain, filters, projectId, search })
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
    sample.details
  );
  const insertSizeStandardDeviation = get(
    "derived_sample_output.summary_stats.insert_size_standard_deviation",
    sample.details
  );

  const meanInsertSizeString = numberWithPlusOrMinus(
    meanInsertSize,
    insertSizeStandardDeviation
  );

  const getConsensusGenomeField = path =>
    get(
      [WORKFLOWS.CONSENSUS_GENOME.value, "cached_results", ...path],
      sample.details
    );
  const consensusGenomeFields = {
    coverageDepth: getConsensusGenomeField(["coverage_viz", "coverage_depth"]),
    totalReadsCG: getConsensusGenomeField(["quality_metrics", "total_reads"]),
    gcPercent: getConsensusGenomeField(["quality_metrics", "gc_percent"]),
    refSnps: getConsensusGenomeField(["quality_metrics", "ref_snps"]),
    percentIdentity: getConsensusGenomeField([
      "quality_metrics",
      "percent_identity",
    ]),
    nActg: getConsensusGenomeField(["quality_metrics", "n_actg"]),
    percentGenomeCalled: getConsensusGenomeField([
      "quality_metrics",
      "percent_genome_called",
    ]),
    nMissing: getConsensusGenomeField(["quality_metrics", "n_missing"]),
    nAmbiguous: getConsensusGenomeField(["quality_metrics", "n_ambiguous"]),
    wetlabProtocol: upperCase(
      get([WORKFLOWS.CONSENSUS_GENOME.value, "wetlab_protocol"], sample.details)
    ),
  };

  const row = {
    sample: {
      initialWorkflow: get("db_sample.initial_workflow", sample.details),
      name: sample.name,
      project: get("derived_sample_output.project_name", sample.details),
      publicAccess: !!sample.public,
      statusByWorkflow: mapValues(
        runInfo => toLower(runInfo.result_status_description),
        get("run_info_by_workflow", sample.details)
      ),
      uploadError: toLower(
        get("upload_error.result_status_description", sample.details)
      ),
      user: get("uploader.name", sample.details),
      userId: get("uploader.id", sample.details),
    },
    collectionLocation: get("metadata.collection_location", sample.details),
    collectionLocationV2: get(
      "metadata.collection_location_v2",
      sample.details
    ),
    createdAt: sample.created_at,
    duplicateCompressionRatio: get(
      "derived_sample_output.summary_stats.compression_ratio",
      sample.details
    ),
    erccReads: get(
      "derived_sample_output.pipeline_run.total_ercc_reads",
      sample.details
    ),
    host: get("derived_sample_output.host_genome_name", sample.details),
    id: sample.id,
    meanInsertSize: meanInsertSizeString || "",
    nonHostReads: {
      value: get(
        "derived_sample_output.summary_stats.adjusted_remaining_reads",
        sample.details
      ),
      percent: get(
        "derived_sample_output.summary_stats.percent_remaining",
        sample.details
      ),
    },
    notes: get("db_sample.sample_notes", sample.details),
    nucleotideType: get("metadata.nucleotide_type", sample.details),
    pipelineVersion: get(
      "derived_sample_output.pipeline_run.pipeline_version",
      sample.details
    ),
    privateUntil: sample.private_until,
    projectId: sample.project_id,
    qcPercent: get(
      "derived_sample_output.summary_stats.qc_percent",
      sample.details
    ),
    sampleType: get("metadata.sample_type", sample.details),
    subsampledFraction: get(
      "derived_sample_output.pipeline_run.fraction_subsampled",
      sample.details
    ),
    totalReads: get(
      "derived_sample_output.pipeline_run.total_reads",
      sample.details
    ),
    totalRuntime: get(
      [
        "run_info_by_workflow",
        WORKFLOWS.SHORT_READ_MNGS.value,
        "total_runtime",
      ],
      sample.details
    ),
    waterControl: get("metadata.water_control", sample.details),
    ...consensusGenomeFields,
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
    listAllIds,
    sampleIds,
  });
  return {
    samples: map(processRawSample, sampleResults.samples),
    sampleIds: sampleResults.all_samples_ids,
  };
};

const getDiscoveryProjects = async ({
  domain,
  filters,
  projectId,
  search,
  limit = 100,
  offset = 0,
  listAllIds = false,
} = {}) => {
  const projectResults = await getProjects({
    domain,
    filters,
    projectId,
    search,
    limit,
    offset,
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
  listAllIds = false,
} = {}) => {
  const visualizations = await getVisualizations({
    domain,
    filters,
    search,
    limit,
    offset,
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
};
