import {
  bulkUploadRemoteSamples,
  bulkUploadRemoteSamplesWithMetadata,
  createSample,
  createSampleWithMetadata,
  markSampleUploaded,
  uploadFileToUrl
} from "~/api";

export const bulkUploadRemote = ({ samples, metadata }) =>
  metadata
    ? bulkUploadRemoteSamplesWithMetadata(samples, metadata)
    : bulkUploadRemoteSamples(samples);

export const bulkUploadLocal = ({
  sampleNamesToFiles,
  project,
  hostId,
  metadata,
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
    const createSamplePromise = metadata
      ? createSampleWithMetadata({
          sourceType: "local",
          inputFiles: files,
          name: sampleName,
          projectName: project.name,
          hostGenomeId: hostId,
          metadata: metadata[sampleName]
        })
      : // TODO(mark): Remove this endpoint once we launch the new sample upload flow.
        createSample(sampleName, project.name, hostId, files, "local");

    createSamplePromise
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
