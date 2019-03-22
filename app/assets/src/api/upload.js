import {
  bulkUploadRemoteSamples,
  createSample,
  markSampleUploaded,
  uploadFileToUrlWithRetries
} from "~/api";

import { bulkUploadWithMetadata } from "~/api/metadata";
import { putWithCSRF } from "./core";

export const bulkUploadRemote = ({ samples, metadata }) =>
  metadata
    ? bulkUploadWithMetadata(samples, metadata)
    : bulkUploadRemoteSamples(samples);

export const bulkUploadLocalWithMetadata = ({
  samples,
  sampleNamesToFiles,
  metadata,
  onCreateSamplesError,
  onUploadProgress,
  onUploadError,
  onAllUploadsComplete,
  onMarkSampleUploadedError
}) => {
  // Store the upload progress of file names, so we can track when
  // everything is done.
  const fileNamesToProgress = {};

  // This function needs access to fileNamesToProgress.
  const onFileUploadSuccess = (sampleName, sampleId) => {
    const sampleFiles = sampleNamesToFiles[sampleName];
    // If every file for this sample is uploaded, mark it as uploaded.
    if (sampleFiles.every(f => fileNamesToProgress[f.name] === 100)) {
      markSampleUploaded(sampleId)
        .then(() => {
          // If every file-to-upload in this batch is done uploading
          if (Object.values(fileNamesToProgress).every(p => p === 100)) {
            window.onbeforeunload = null;
            onAllUploadsComplete();
          }
        })
        .catch(() => onMarkSampleUploadedError(sampleName));
    }
  };

  // Latest browsers will only show a generic warning
  window.onbeforeunload = () =>
    "Uploading is in progress. Are you sure you want to exit?";

  bulkUploadWithMetadata(samples, metadata)
    .then(response => {
      if (response.errors.length > 0) {
        onCreateSamplesError(response.errors);
      }

      // After successful sample creation, upload each sample's input files to the presigned URLs
      response.samples.forEach(sample => {
        const sampleName = sample.name;
        const files = sampleNamesToFiles[sampleName];

        files.map((file, i) => {
          const url = sample.input_files[i].presigned_url;

          uploadFileToUrlWithRetries(file, url, {
            onUploadProgress: e => {
              const percent = Math.round(e.loaded * 100 / e.total);
              fileNamesToProgress[file.name] = percent;
              if (onUploadProgress) {
                onUploadProgress(percent, file);
              }
            },
            onSuccess: () => onFileUploadSuccess(sampleName, sample.id),
            onError: error => onUploadError(file, error)
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
  onMarkSampleUploadedError
}) => {
  // Store the upload progress of file names, so we can track when
  // everything is done.
  const fileNamesToProgress = {};

  // This function needs access to fileNamesToProgress.
  const onFileUploadSuccess = (sampleName, sampleId) => {
    const sampleFiles = sampleNamesToFiles[sampleName];
    // If every file for this sample is uploaded, mark it as uploaded.
    if (sampleFiles.every(f => fileNamesToProgress[f.name] === 100)) {
      markSampleUploaded(sampleId)
        .then(() => {
          // If every file-to-upload in this batch is done uploading
          if (Object.values(fileNamesToProgress).every(p => p === 100)) {
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
            onError: error => onUploadError(file, error)
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
  const interval = 60000; // 60 sec
  setInterval(() => {
    putWithCSRF(`/samples/${sampleId}/upload_heartbeat.json`).catch(() =>
      console.log("Can't connect to IDseq server.")
    );
  }, interval);
};
