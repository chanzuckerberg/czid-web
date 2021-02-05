import {
  get,
  find,
  map,
  keyBy,
  mapValues,
  every,
  pick,
  sum,
  difference,
} from "lodash/fp";

import { markSampleUploaded, uploadFileToUrlWithRetries } from "~/api";

import { putWithCSRF, postWithCSRF } from "./core";

export const MAX_MARK_SAMPLE_RETRIES = 10;

export const exponentialDelayWithJitter = tryCount => {
  // ~13 sec, ~46 sec, ~158 sec, ... -> ~115 minutes.
  // Derived via eyeballing. Adjust based on user feedback.
  const delay = ((tryCount + Math.random()) * 10) ** 3.5 + 10000;
  return new Promise(resolve => setTimeout(resolve, delay));
};

export const bulkUploadBasespace = ({ samples, metadata }) =>
  bulkUploadWithMetadata(samples, metadata);

export const bulkUploadRemote = ({ samples, metadata }) =>
  bulkUploadWithMetadata(samples, metadata);

export const initiateBulkUploadLocalWithMetadata = async ({
  samples,
  metadata,
  callbacks = {
    onCreateSamplesError: null,
  },
}) => {
  // Only upload these fields from the sample.
  const processedSamples = map(
    pick([
      "alignment_config_name",
      "client",
      "dag_vars",
      "do_not_process",
      "host_genome_id",
      "input_files_attributes",
      "max_input_fragments",
      "name",
      "pipeline_branch",
      "pipeline_execution_strategy",
      "project_id",
      "s3_preload_result_path",
      "subsample",
      "wetlab_protocol",
      "workflows",
    ]),
    samples
  );

  let response;

  try {
    // Creates the Sample objects and assigns a presigned S3 URL so we can upload the sample files to S3 via the URL
    response = await bulkUploadWithMetadata(processedSamples, metadata);
  } catch (e) {
    callbacks.onCreateSamplesError &&
      callbacks.onCreateSamplesError([e], map("name", samples));
    return;
  }

  // It's possible that a subset of samples errored out, but other ones can still be uploaded.
  if (response.errors.length > 0) {
    callbacks.onCreateSamplesError &&
      callbacks.onCreateSamplesError(
        response.errors,
        response.errored_sample_names
      );
  }

  // The samples created from the network response (response.samples) does not contain the files that need to be upload to S3.
  // They contain information pertaining to the sample itself (metadata) as well as presigned S3 URL links
  // The sample files that need to be uploaded to S3 are in the samples argument passed into initiateBulkUploadLocalWithMetadata
  // So we need to fetch the files from samples argument and copy them over to response.samples where they're later uploaded to S3 via uploadSampleFilesToPresignedURL
  response.samples.forEach(
    createdSample =>
      (createdSample["filesToUpload"] = get(
        "files",
        find({ name: createdSample.name }, samples)
      ))
  );
  return response.samples;
};

export const uploadSampleFilesToPresignedURL = ({
  samples,
  callbacks = {
    onSampleUploadProgress: null,
    onSampleUploadError: null,
    onSampleUploadSuccess: null,
    onMarkSampleUploadedError: null,
  },
}) => {
  // Store the upload progress of file names, so we can track when
  // everything is done.
  const fileNamesToProgress = {};
  const markedUploaded = {};
  const sampleNamesToFiles = mapValues("filesToUpload", keyBy("name", samples));

  // This function needs access to fileNamesToProgress.
  const onFileUploadSuccess = async (sample, sampleId) => {
    const sampleFiles = sampleNamesToFiles[sample.name];
    // If every file for this sample is uploaded, mark it as uploaded.
    if (
      !markedUploaded[sample.name] &&
      every(file => fileNamesToProgress[file.name] === 1, sampleFiles)
    ) {
      markedUploaded[sample.name] = true;

      let tryCount = 0;
      while (true) {
        try {
          await markSampleUploaded(sampleId);

          callbacks.onSampleUploadSuccess &&
            callbacks.onSampleUploadSuccess(sample);
          break;
        } catch (_) {
          tryCount++;
          if (tryCount === MAX_MARK_SAMPLE_RETRIES) {
            callbacks.onMarkSampleUploadedError &&
              callbacks.onMarkSampleUploadedError(sample);
            break;
          }
          await exponentialDelayWithJitter(tryCount);
        }
      }
    }
  };

  // Calculate the current sample upload percentage.
  const getSampleUploadPercentage = sample => {
    const sampleFiles = sample.input_files.map(inputFileAttributes => {
      return sampleNamesToFiles[sample.name][inputFileAttributes.name];
    });

    const sampleFileUploadProgress = map(
      file => ({
        percentage: fileNamesToProgress[file.name] || null,
        size: file.size,
      }),
      sampleFiles
    );

    const uploadedSize = sum(
      map(
        progress => (progress.percentage || 0) * progress.size,
        sampleFileUploadProgress
      )
    );

    const totalSize = sum(
      map(progress => progress.size, sampleFileUploadProgress)
    );

    return uploadedSize / totalSize;
  };

  samples.forEach(sample => {
    const files = sampleNamesToFiles[sample.name];

    // Start pinging server to monitor uploads server-side
    const interval = startUploadHeartbeat(sample.id);

    sample.input_files.map(inputFileAttributes => {
      const file = files[inputFileAttributes.name];
      const url = inputFileAttributes.presigned_url;

      uploadFileToUrlWithRetries(file, url, {
        onUploadProgress: e => {
          const percent = e.loaded / e.total;
          fileNamesToProgress[file.name] = percent;

          if (callbacks.onSampleUploadProgress) {
            const uploadedPercentage = getSampleUploadPercentage(sample);
            callbacks.onSampleUploadProgress(sample, uploadedPercentage);
          }
        },
        onSuccess: () => {
          fileNamesToProgress[file.name] = 1;
          onFileUploadSuccess(sample, sample.id);
          clearInterval(interval);
        },
        onError: error => {
          fileNamesToProgress[file.name] = 0;
          callbacks.onSampleUploadError &&
            callbacks.onSampleUploadError(sample, error);
          clearInterval(interval);
        },
      });
    });
  });
};

// Bulk-upload samples (both local and remote), with metadata.
const bulkUploadWithMetadata = async (samples, metadata) => {
  const response = await postWithCSRF(
    `/samples/bulk_upload_with_metadata.json`,
    {
      samples,
      metadata,
      client: "web",
    }
  );

  // Add the errored sample names to the response.
  if (response.errors.length > 0) {
    const erroredSampleNames = difference(
      map("name", samples),
      map("name", response.samples)
    );

    return {
      ...response,
      errored_sample_names: erroredSampleNames,
    };
  }

  return response;
};

// Local uploads go directly from the browser to S3, so we don't know if an upload was interrupted.
// Ping the heartbeat endpoint periodically to say the browser is actively uploading this sample.
export const startUploadHeartbeat = async sampleId => {
  const sendHeartbeat = () => {
    putWithCSRF(`/samples/${sampleId}/upload_heartbeat.json`).catch(() =>
      // eslint-disable-next-line no-console
      console.error("Can't connect to IDseq server.")
    );
  };
  sendHeartbeat(); // Send first heartbeat immediately so we know it is working

  // Range from 170-230 seconds each. Picked via eyeballing.
  const interval = (17 + 6 * Math.random()) * 10000;
  return setInterval(sendHeartbeat, interval);
};
