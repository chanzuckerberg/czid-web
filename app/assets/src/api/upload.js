import { flow, keyBy, mapValues } from "lodash/fp";
import {
  bulkUploadRemoteSamples,
  bulkUploadWithMetadata,
  createSample,
  markSampleUploaded,
  uploadFileToUrl
} from "~/api";

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
  onMarkSampleUploadedError
}) => {
  // Store the upload progress of file names, so we can track when
  // everything is done.
  const fileNamesToProgress = {};

  const sampleNamesToFiles = flow(
    keyBy("name"),
    mapValues(sample => sample.input_files_attributes)
  )(samples);

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

          uploadFileToUrl(file, url, {
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
    .catch(() => {
      if (onCreateSamplesError) {
        onCreateSamplesError();
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
        files.map((file, i) => {
          const url = response.input_files[i].presigned_url;

          uploadFileToUrl(file, url, {
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
