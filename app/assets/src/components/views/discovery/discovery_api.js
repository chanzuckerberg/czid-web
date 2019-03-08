import { get, map } from "lodash/fp";
import {
  getProjects,
  getSamples,
  getProjectDimensions,
  getSampleDimensions
} from "~/api";
import { getVisualizations } from "../../../api";

const DISCOVERY_DOMAIN_LIBRARY = "library";
const DISCOVERY_DOMAIN_PUBLIC = "public";

const getDiscoveryData = async ({ domain, filters }) => {
  try {
    // Todo(tiago): maybe we should process them independently, otherwise
    // our response time will be the same as the worst case.
    const [samples, projects, visualizations] = await Promise.all([
      getDiscoverySamples({ domain, filters, includeIds: true }),
      getProjects({ domain, filters }),
      getVisualizations({ domain, filters })
    ]);

    return {
      samples: samples.samples,
      sampleIds: samples.all_samples_ids,
      projects,
      visualizations
    };
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(error);
    return {};
  }
};

const getDiscoveryDimensions = async ({ domain }) => {
  try {
    const [sampleDimensions, projectDimensions] = await Promise.all([
      getSampleDimensions({ domain }),
      getProjectDimensions({ domain })
    ]);
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
    collectionLocation: get("metadata.collection_location", sample.details),
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
    passedQC: get(
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
    totalRuntime: get("run_info.total_runtime", sample.details)
  };
  return row;
};

const getDiscoverySamples = async ({
  domain,
  filters,
  limit = 100,
  offset = 0,
  includeIds = false
} = {}) => {
  const sampleResults = await getSamples({
    domain,
    filters,
    limit,
    offset,
    includeIds
  });
  return {
    samples: map(processRawSample, sampleResults.samples),
    all_samples_ids: sampleResults.all_samples_ids
  };
};

export {
  DISCOVERY_DOMAIN_LIBRARY,
  DISCOVERY_DOMAIN_PUBLIC,
  getDiscoveryData,
  getDiscoveryDimensions,
  getDiscoverySamples
};
