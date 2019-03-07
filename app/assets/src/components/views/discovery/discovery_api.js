import { get, map } from "lodash/fp";
import { getSamples, getProjects, getSampleDimensions } from "~/api";

const DISCOVERY_DOMAIN_LIBRARY = "library";
const DISCOVERY_DOMAIN_PUBLIC = "public";

const getDiscoveryData = async ({ domain, filters }) => {
  try {
    // Todo(tiago): split these: we actually should process them independently, otherwise
    // our response time will be the same as the worst case.
    const [samples, projects] = await Promise.all([
      getDiscoverySamples({ domain, filters, includeIds: true }),
      getProjects({ domain, filters })
    ]);

    console.log("discovrey_api:getDiscoveryData", samples);
    return {
      samples: samples.samples,
      sampleIds: samples.all_samples_ids,
      projects
    };
  } catch (error) {
    // eslint-disable-next-line no-console
    console.log(error);
    return {};
  }
};

const getDiscoveryDimensions = async ({ domain }) => {
  try {
    return await getSampleDimensions({ domain });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.log(error);
    return {};
  }
};

const processRawSample = sample => {
  const row = {
    sample: {
      name: sample.name,
      // TODO(tiago): replace by real value
      publicAccess: false,
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
    totalRuntime: get("run_info.total_runtime", sample.details),
    subsampledFraction: get(
      "derived_sample_output.pipeline_run.fraction_subsampled",
      sample.details
    ),
    totalReads: get(
      "derived_sample_output.pipeline_run.total_reads",
      sample.details
    )
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
  console.log("discovery_api:getDiscoverySamples", "params", {
    domain,
    filters,
    limit,
    offset,
    includeIds
  });
  const sampleResults = await getSamples({
    domain,
    filters,
    limit,
    offset,
    includeIds
  });
  console.log("discovery_api:getDiscoverySamples", "results", sampleResults);
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
