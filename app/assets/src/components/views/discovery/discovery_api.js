import { compact, get, map } from "lodash/fp";
import {
  getProjects,
  getSamples,
  getProjectDimensions,
  getSampleDimensions,
  getVisualizations
} from "~/api";
import { filterLocation } from "~utils/metadata";

const DISCOVERY_DOMAIN_LIBRARY = "library";
const DISCOVERY_DOMAIN_PUBLIC = "public";

const getDiscoverySyncData = async ({ domain, filters, search }) => {
  try {
    const [projects, visualizations] = await Promise.all([
      getProjects({ domain, filters, search }),
      getVisualizations({ domain, filters, search })
    ]);

    return {
      projects,
      visualizations
    };
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(error);
    return {};
  }
};

const getDiscoveryDimensions = async ({
  domain,
  filters,
  projectId,
  search
}) => {
  try {
    const actions = compact([
      getSampleDimensions({ domain, filters, projectId, search }),
      !projectId && getProjectDimensions({ domain, filters, search })
    ]);
    const [sampleDimensions, projectDimensions] = await Promise.all(actions);
    return { sampleDimensions, projectDimensions };
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(error);
    return {};
  }
};

const processRawSample = sample => {
  const row = {
    sample: {
      name: sample.name,
      publicAccess: !!sample.public,
      user: get("uploader.name", sample.details),
      project: get("derived_sample_output.project_name", sample.details),
      createdAt: sample.created_at,
      status: get(
        "run_info.result_status_description",
        sample.details
      ).toLowerCase()
    },
    collectionLocation: filterLocation(
      get("metadata.collection_location", sample.details)
    ),
    duplicateCompressionRatio: get(
      "derived_sample_output.summary_stats.compression_ratio",
      sample.details
    ),
    erccReads: get(
      "derived_sample_output.pipeline_run.total_ercc_reads",
      sample.details
    ),
    host: get("db_sample.host_genome_name", sample.details),
    id: sample.id,
    nonHostReads: {
      value: get(
        "derived_sample_output.summary_stats.adjusted_remaining_reads",
        sample.details
      ),
      percent: get(
        "derived_sample_output.summary_stats.percent_remaining",
        sample.details
      )
    },
    notes: sample.sample_notes,
    nucleotideType: get("metadata.nucleotide_type", sample.details),
    qcPercent: get(
      "derived_sample_output.summary_stats.qc_percent",
      sample.details
    ),
    sampleType: get("metadata.sample_type", sample.details),
    sampleLocation: get("db_sample.sample_location", sample.details),
    subsampledFraction: get(
      "derived_sample_output.pipeline_run.fraction_subsampled",
      sample.details
    ),
    totalReads: get(
      "derived_sample_output.pipeline_run.total_reads",
      sample.details
    ),
    totalRuntime: get("run_info.total_runtime", sample.details)
  };
  return row;
};

const getDiscoverySamples = async ({
  domain,
  filters,
  projectId,
  search,
  limit = 100,
  offset = 0,
  listAllIds = false
} = {}) => {
  const sampleResults = await getSamples({
    domain,
    filters,
    projectId,
    search,
    limit,
    offset,
    listAllIds
  });
  return {
    samples: map(processRawSample, sampleResults.samples),
    sampleIds: sampleResults.all_samples_ids
  };
};

export {
  DISCOVERY_DOMAIN_LIBRARY,
  DISCOVERY_DOMAIN_PUBLIC,
  getDiscoverySyncData,
  getDiscoveryDimensions,
  getDiscoverySamples
};
