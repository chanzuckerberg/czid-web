import { map, keyBy, mapValues, every, pick } from "lodash/fp";

import {
  bulkUploadRemoteSamples,
  createSample,
  markSampleUploaded,
  uploadFileToUrlWithRetries,
} from "~/api";

import { bulkUploadWithMetadata } from "~/api/metadata";
import { putWithCSRF } from "./core";

export const bulkUploadBasespace = async ({ samples, metadata }) =>
  bulkUploadWithMetadata(samples, metadata);

export const bulkUploadRemote = ({ samples, metadata }) =>
  metadata
    ? bulkUploadWithMetadata(samples, metadata)
    : bulkUploadRemoteSamples(samples);

export const bulkUploadLocalWithMetadata = ({
  samples,
  metadata,
  onCreateSamplesError,
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

  const sampleNamesToFiles = mapValues("files", keyBy("name", samples));

  // Only upload these fields from the sample.
  const processedSamples = map(
    pick([
      "client",
      "host_genome_id",
      "input_files_attributes",
      "name",
      "project_id",
    ]),
    samples
  );

  // This function needs access to fileNamesToProgress.
  const onFileUploadSuccess = (sampleName, sampleId) => {
    const sampleFiles = sampleNamesToFiles[sampleName];
    // If every file for this sample is uploaded, mark it as uploaded.
    if (
      !markedUploaded[sampleName] &&
      every(file => fileNamesToProgress[file.name] === 100, sampleFiles)
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
            onAllUploadsComplete();
          }
        })
        .catch(() => onMarkSampleUploadedError(sampleName));
    }
  };

  bulkUploadWithMetadata(processedSamples, metadata)
    .then(response => {
      if (response.errors.length > 0) {
        onCreateSamplesError(response.errors);
      }

      // After successful sample creation, upload each sample's input files to the presigned URLs
      response.samples.forEach(sample => {
        const sampleName = sample.name;
        const files = sampleNamesToFiles[sampleName];

        // Start pinging server to monitor uploads server-side
        startUploadHeartbeat(sample.id);

        sample.input_files.map(inputFileAttributes => {
          const file = files[inputFileAttributes.name];
          const url = inputFileAttributes.presigned_url;

          uploadFileToUrlWithRetries(file, url, {
            onUploadProgress: e => {
              const percent = Math.floor(e.loaded * 100 / e.total);
              fileNamesToProgress[file.name] = percent;
              if (onUploadProgress) {
                onUploadProgress(percent, file);
              }
            },
            onSuccess: () => {
              fileNamesToProgress[file.name] = 100;
              onFileUploadSuccess(sampleName, sample.id);
            },
            onError: error => onUploadError(file, error),
          });
        });
      });
    })
    .catch(e => {
      if (onCreateSamplesError) {
        onCreateSamplesError(e);
      }
    });
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
  setInterval(sendHeartbeat, interval);
};
