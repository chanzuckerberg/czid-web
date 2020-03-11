import { map, keyBy, mapValues, every, pick, sum, difference } from "lodash/fp";

import {
  bulkUploadRemoteSamples,
  createSample,
  markSampleUploaded,
  uploadFileToUrlWithRetries,
} from "~/api";

import { putWithCSRF, postWithCSRF } from "./core";

export const bulkUploadBasespace = async ({ samples, metadata }) =>
  bulkUploadWithMetadata(samples, metadata);

export const bulkUploadRemote = ({ samples, metadata }) =>
  metadata
    ? bulkUploadWithMetadata(samples, metadata)
    : bulkUploadRemoteSamples(samples);

export const bulkUploadLocalWithMetadata = async ({
  samples,
  metadata,
  callbacks = {
    onCreateSamplesError: null,
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
  const sampleNamesToFiles = mapValues("files", keyBy("name", samples));

  // Only upload these fields from the sample.
  const processedSamples = map(
    pick([
      "client",
      "host_genome_id",
      "input_files_attributes",
      "name",
      "project_id",
      "do_not_process",
      "pipeline_execution_strategy",
      "use_taxon_whitelist",
    ]),
    samples
  );

  // This function needs access to fileNamesToProgress.
  const onFileUploadSuccess = async (sample, sampleId) => {
    const sampleFiles = sampleNamesToFiles[sample.name];
    // If every file for this sample is uploaded, mark it as uploaded.
    if (
      !markedUploaded[sample.name] &&
      every(file => fileNamesToProgress[file.name] === 1, sampleFiles)
    ) {
      markedUploaded[sample.name] = true;
      try {
        await markSampleUploaded(sampleId);

        callbacks.onSampleUploadSuccess &&
          callbacks.onSampleUploadSuccess(sample);
      } catch (_) {
        callbacks.onMarkSampleUploadedError &&
          callbacks.onMarkSampleUploadedError(sample.name);
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

  let response;

  try {
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

  // After successful sample creation, upload each sample's input files to the presigned URLs
  response.samples.forEach(sample => {
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

// TODO(mark): Remove this endpoint once we launch the new sample upload flow
export const bulkUploadLocal = ({
  sampleNamesToFiles,
  project,
  hostId,
  onCreateSampleError,
  onUploadProgress,
  onUploadError,
  onAllUploadsComplete,
  onMarkSampleUploadedError,
}) => {
  // Store the upload progress of file names, so we can track when
  // everything is done.
  const fileNamesToProgress = {};
  const markedUploaded = {};
  let allUploadsCompleteRan = false;

  // This function needs access to fileNamesToProgress.
  const onFileUploadSuccess = (sampleName, sampleId) => {
    const sampleFiles = sampleNamesToFiles[sampleName];
    // If every file for this sample is uploaded, mark it as uploaded.
    if (
      !markedUploaded[sampleName] &&
      sampleFiles.every(f => fileNamesToProgress[f.name] === 100)
    ) {
      markedUploaded[sampleName] = true;
      markSampleUploaded(sampleId)
        .then(() => {
          // If every file-to-upload in this batch is done uploading
          if (
            !allUploadsCompleteRan &&
            Object.keys(sampleNamesToFiles).every(
              sampleName => markedUploaded[sampleName]
            )
          ) {
            allUploadsCompleteRan = true;
            window.onbeforeunload = null;
            onAllUploadsComplete();
          }
        })
        .catch(onMarkSampleUploadedError);
    }
  };

  // Latest browsers will only show a generic warning
  window.onbeforeunload = () =>
    "Uploading is in progress. Are you sure you want to exit?";

  // Send an API call to create new samples with the expected files
  for (const [sampleName, files] of Object.entries(sampleNamesToFiles)) {
    createSample(sampleName, project.name, hostId, files, "local")
      .then(response => {
        // After successful sample creation, upload to the presigned URLs returned
        const sampleId = response.id;
        startUploadHeartbeat(sampleId);
        files.map((file, i) => {
          const url = response.input_files[i].presigned_url;

          uploadFileToUrlWithRetries(file, url, {
            onUploadProgress: e => {
              const percent = Math.round(e.loaded * 100 / e.total);
              fileNamesToProgress[file.name] = percent;
              if (onUploadProgress) {
                onUploadProgress(percent, file);
              }
            },
            onSuccess: () => onFileUploadSuccess(sampleName, sampleId),
            onError: error => onUploadError(file, error),
          });
        });
      })
      .catch(error => {
        if (onCreateSampleError) {
          onCreateSampleError(error, sampleName);
        }
      });
  }
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
  const interval = 60000; // 60 sec
  return setInterval(sendHeartbeat, interval);
};
