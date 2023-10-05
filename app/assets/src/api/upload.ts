import { difference, find, get, map, pick } from "lodash/fp";
import { markSampleUploaded } from "~/api";
import { get as httpGet, postWithCSRF } from "./core";

export const MAX_MARK_SAMPLE_RETRIES = 10;

export const exponentialDelayWithJitter = (tryCount: $TSFixMe) => {
  // ~13 sec, ~46 sec, ~158 sec, ... -> ~115 minutes.
  // Derived via eyeballing. Adjust based on user feedback.
  const delay = ((tryCount + Math.random()) * 10) ** 3.5 + 10000;
  return new Promise(resolve => setTimeout(resolve, delay));
};

export const bulkUploadBasespace = ({ samples, metadata }: $TSFixMe) =>
  bulkUploadWithMetadata(samples, metadata);

export const bulkUploadRemote = ({ samples, metadata }: $TSFixMe) =>
  bulkUploadWithMetadata(samples, metadata);

export const initiateBulkUploadLocalWithMetadata = async ({
  samples,
  metadata,

  onCreateSamplesError = (errors: $TSFixMe, erroredSampleNames: $TSFixMe) => {
    console.error(
      "CreateSamplesError",
      errors,
      "erroredSamplesNames",
      erroredSampleNames,
    );
  },
}: $TSFixMe) => {
  // Only upload these fields from the sample.
  const processedSamples = map(
    pick([
      "accession_id",
      "accession_name",
      "alignment_config_name",
      "alignment_scalability",
      "clearlabs",
      "client",
      "dag_vars",
      "do_not_process",
      "guppy_basecaller_setting",
      "host_genome_id",
      "input_files_attributes",
      "max_input_fragments",
      "medaka_model",
      "name",
      "pipeline_branch",
      "pipeline_execution_strategy",
      "primer_bed",
      "project_id",
      "ref_fasta",
      "taxon_id",
      "taxon_name",
      "s3_preload_result_path",
      "subsample",
      "technology",
      "wetlab_protocol",
      "workflows",
    ]),
    samples,
  );

  // Process extra options
  processedSamples.forEach(processedSample => {
    if (
      "alignment_scalability" in processedSample &&
      processedSample["alignment_scalability"] === "true"
    ) {
      processedSample["dag_vars"] = JSON.stringify({
        NonHostAlignment: { alignment_scalability: true },
      });
    }
  });

  let response;

  try {
    // Creates the Sample objects and assigns a presigned S3 URL so we can upload the sample files to S3 via the URL
    response = await bulkUploadWithMetadata(processedSamples, metadata);
  } catch (e) {
    onCreateSamplesError && onCreateSamplesError([e], map("name", samples));
    return;
  }

  // It's possible that a subset of samples errored out, but other ones can still be uploaded.
  if (response.errors.length > 0) {
    onCreateSamplesError &&
      onCreateSamplesError(response.errors, response.errored_sample_names);
  }

  // The samples created from the network response (response.samples) does not contain the files that need to be upload to S3.
  // They contain information pertaining to the sample itself (metadata) as well as presigned S3 URL links
  // The sample files that need to be uploaded to S3 are in the samples argument passed into initiateBulkUploadLocalWithMetadata
  // So we need to fetch the files from samples argument and copy them over to response.samples where they're later uploaded to S3 via uploadSampleFilesToPresignedURL
  response.samples.forEach(
    (createdSample: $TSFixMe) =>
      (createdSample["filesToUpload"] = get(
        "files",
        find({ name: createdSample.name }, samples),
      )),
  );
  return response.samples;
};

export const completeSampleUpload = async ({
  sample,
  onSampleUploadSuccess = null,
  onMarkSampleUploadedError = null,
}: $TSFixMe) => {
  let tryCount = 0;
  while (true) {
    try {
      await markSampleUploaded(sample.id);

      onSampleUploadSuccess && onSampleUploadSuccess(sample);
      break;
    } catch (e) {
      tryCount++;
      if (tryCount === MAX_MARK_SAMPLE_RETRIES) {
        onMarkSampleUploadedError && onMarkSampleUploadedError(sample, e);
        break;
      }
      await exponentialDelayWithJitter(tryCount);
    }
  }
};

// Bulk-upload samples (both local and remote), with metadata.
const bulkUploadWithMetadata = async (
  samples: $TSFixMe,
  metadata: $TSFixMe,
) => {
  const response = await postWithCSRF(
    `/samples/bulk_upload_with_metadata.json`,
    {
      samples,
      metadata,
      client: "web",
    },
  );

  // Add the errored sample names to the response.
  if (response.errors.length > 0) {
    const erroredSampleNames = difference(
      map("name", samples),
      map("name", response.samples),
    );

    return {
      ...response,
      errored_sample_names: erroredSampleNames,
    };
  }

  return response;
};

// Local uploads go directly from the browser to S3, so we don't know if an upload was interrupted.
// Ping a heartbeat periodically to say the browser is actively uploading the samples.
export const startUploadHeartbeat = async () => {
  const sendHeartbeat = () => sendHeartbeat(); // Send first heartbeat immediately so we know it is working

  const minutes = 10; // Picked arbitrarily, adjust as needed.
  const milliseconds = minutes * 60 * 10000;
  return setInterval(sendHeartbeat, milliseconds);
};

export const getUploadCredentials = (sampleId: $TSFixMe) =>
  httpGet(`/samples/${sampleId}/upload_credentials.json`);
