import cx from "classnames";
import {
  isEmpty,
  filter,
  map,
  sum,
  take,
  zipObject,
  times,
  constant,
  pick,
  size,
  find,
} from "lodash/fp";
import React, { useEffect, useState } from "react";
import { logAnalyticsEvent, withAnalytics } from "~/api/analytics";
import {
  initiateBulkUploadLocalWithMetadata,
  bulkUploadRemote,
  bulkUploadBasespace,
  uploadSampleFilesToPresignedURL,
} from "~/api/upload";
import LoadingBar from "~/components/ui/controls/LoadingBar";
import PrimaryButton from "~/components/ui/controls/buttons/PrimaryButton";
import { formatFileSize } from "~/components/utils/format";
import { logError } from "~/components/utils/logUtil";
import PropTypes from "~/components/utils/propTypes";

import { CG_TECHNOLOGY_OPTIONS } from "~/components/views/SampleUploadFlow/constants";
import Modal from "~ui/containers/Modal";
import { IconAlert, IconCheckSmall, IconSuccess } from "~ui/icons";
import ImgUploadPrimary from "~ui/illustrations/ImgUploadPrimary";
import Notification from "~ui/notifications/Notification";
import UploadConfirmationModal from "./UploadConfirmationModal";

import cs from "./upload_progress_modal.scss";

const BASESPACE_SAMPLE_FIELDS = [
  "name",
  "project_id",
  "host_genome_id",
  "basespace_access_token",
  "basespace_dataset_id",
];

const NUM_FAILED_SAMPLES_TO_DISPLAY = 3;

const PIPELINE_EXECUTION_STRATEGIES = {
  directed_acyclic_graph: "directed_acyclic_graph",
  step_function: "step_function",
};

const UploadProgressModal = ({
  adminOptions,
  clearlabs,
  technology,
  medakaModel,
  metadata,
  onUploadComplete,
  project,
  samples,
  skipSampleProcessing,
  uploadType,
  useStepFunctionPipeline,
  wetlabProtocol,
  workflows,
}) => {
  const [confirmationModalOpen, setConfirmationModalOpen] = useState(false);
  const [locallyCreatedSamples, setLocallyCreatedSamples] = useState([]);
  const [retryingSampleUpload, setRetryingSampleUpload] = useState(false);

  // For local uploads.
  const [sampleUploadPercentages, setSampleUploadPercentages] = useState({});
  const [sampleUploadStatuses, setSampleUploadStatuses] = useState({});
  const [uploadComplete, setUploadComplete] = useState(false);

  // For remote and basespace uploads. Failures for local samples are stored in sampleUploadStatuses.
  const [failedSampleNames, setFailedSampleNames] = useState([]);

  // Initiate upload as soon as the modal is opened.
  useEffect(() => {
    if (uploadType === "local") {
      initiateUploadLocal();
    } else {
      initiateUpload();
    }
  }, []);

  useEffect(() => {
    // For local uploads, check if all samples are completed whenever sampleUploadStatuses changes.
    if (
      uploadType === "local" &&
      !uploadComplete &&
      !retryingSampleUpload &&
      isEmpty(getLocalSamplesInProgress())
    ) {
      onUploadComplete();
      setUploadComplete(true);

      if (!isEmpty(getLocalSamplesFailed())) {
        const failedSamples = filter(
          sample => sampleUploadStatuses[sample.name] === "error",
          samples,
        );
        logUploadFailed(
          failedSamples.length,
          samples.length - failedSamples.length,
        );
      } else {
        logUploadSucceeded(samples.length);
      }
    }
  }, [sampleUploadStatuses]);

  const updateSampleUploadStatus = (sampleName, status) => {
    setSampleUploadStatuses(prevState => ({
      ...prevState,
      [sampleName]: status,
    }));
  };

  const updateSampleUploadPercentage = (sampleName, percentage) => {
    setSampleUploadPercentages(prevState => ({
      ...prevState,
      [sampleName]: percentage,
    }));
  };

  // Add any flags selected by the user in the Review Step.
  const addFlagsToSamples = samples => {
    // eslint-disable-next-line camelcase
    const pipeline_execution_strategy = useStepFunctionPipeline
      ? PIPELINE_EXECUTION_STRATEGIES.step_function
      : PIPELINE_EXECUTION_STRATEGIES.directed_acyclic_graph;

    return samples.map(sample => ({
      ...sample,
      do_not_process: skipSampleProcessing,
      ...(technology === CG_TECHNOLOGY_OPTIONS.NANOPORE && {
        clearlabs,
        medaka_model: medakaModel,
      }),
      pipeline_execution_strategy,
      technology,
      wetlab_protocol: wetlabProtocol,
      workflows: Array.from(workflows),
      ...adminOptions,
    }));
  };

  const checkIfRetriedSamplesCompleted = () => {
    if (retryingSampleUpload && isEmpty(getLocalSamplesInProgress())) {
      setRetryingSampleUpload(false);
      setUploadComplete(true);
    }
  };

  const getUploadProgressCallbacks = () => {
    return {
      onSampleUploadProgress: (sample, percentage) => {
        updateSampleUploadPercentage(sample.name, percentage);
      },
      onSampleUploadError: (sample, error) => {
        logError({
          message:
            "UploadProgressModal: Local sample upload error to S3 occured",
          details: {
            sample,
            error,
          },
        });
        updateSampleUploadStatus(sample.name, "error");
        checkIfRetriedSamplesCompleted();
        logUploadStepError("sampleUpload", 1);
      },
      onSampleUploadSuccess: sample => {
        updateSampleUploadStatus(sample.name, "success");
        checkIfRetriedSamplesCompleted();
      },
      onMarkSampleUploadedError: sample => {
        logError({
          message:
            "UploadProgressModal: An error occured when marking a sample as uploaded",
          details: {
            sample,
          },
        });
        updateSampleUploadStatus(sample.name, "error");
        checkIfRetriedSamplesCompleted();
        logUploadStepError("markSampleUploaded", 1);
      },
    };
  };

  const initiateUploadLocal = () => {
    const samplesToUpload = addFlagsToSamples(samples);

    initiateBulkUploadLocalWithMetadata({
      samples: samplesToUpload,
      metadata,
      callbacks: {
        onCreateSamplesError: (errors, erroredSampleNames) => {
          logError({
            message: "UploadProgressModal: onCreateSamplesError",
            details: { errors },
          });

          const uploadStatuses = zipObject(
            erroredSampleNames,
            times(constant("error"), erroredSampleNames.length),
          );

          setSampleUploadStatuses(prevState => ({
            ...prevState,
            ...uploadStatuses,
          }));

          logUploadStepError("createSamples", erroredSampleNames.length);
        },
      },
    }).then(createdSamples => {
      setLocallyCreatedSamples(createdSamples);
      return uploadSampleFilesToPresignedURL({
        samples: createdSamples,
        callbacks: getUploadProgressCallbacks(),
      });
    });
  };

  // Initiate upload for s3 and basespace samples.
  const initiateUpload = async () => {
    let bulkUploadFn = bulkUploadRemote;
    let bulkUploadFnName = "bulkUploadRemote";
    let samplesToUpload = samples;

    if (uploadType === "basespace") {
      bulkUploadFn = bulkUploadBasespace;
      bulkUploadFnName = "bulkUploadBasespace";
      samplesToUpload = map(pick(BASESPACE_SAMPLE_FIELDS), samplesToUpload);
    }

    samplesToUpload = addFlagsToSamples(samplesToUpload);

    let response;

    try {
      response = await bulkUploadFn({
        samples: samplesToUpload,
        metadata,
      });
    } catch (error) {
      logError({
        message: `UploadProgressModal: ${bulkUploadFnName} error`,
        details: { error },
      });

      setUploadComplete(true);
      setFailedSampleNames(map("name", samples));

      logUploadFailed(samples.length, 0);
      return;
    }

    setUploadComplete(true);
    setFailedSampleNames(response.errored_sample_names || []);

    onUploadComplete();

    if (response.errors.length > 0) {
      logUploadFailed(
        response.errored_sample_names.length,
        response.sample_ids.length,
      );
    } else {
      logUploadSucceeded(response.sample_ids.length);
    }
  };

  // Log an error in a particular step of the upload process.
  // Only applies to local uploads.
  const logUploadStepError = (step, erroredSamples) => {
    logAnalyticsEvent("UploadProgressModal_upload-step_error", {
      erroredSamples,
      step,
      uploadType,
    });
  };

  const logUploadFailed = (erroredSamples, createdSamples) => {
    logAnalyticsEvent("UploadProgressModal_upload_failed", {
      erroredSamples,
      createdSamples,
      uploadType,
    });
  };

  const logUploadSucceeded = createdSamples => {
    logAnalyticsEvent("UploadProgressModal_upload_succeeded", {
      createdSamples,
      uploadType,
    });
  };

  const getUploadPercentageForSample = sample => {
    return sampleUploadPercentages[sample.name];
  };

  const getSampleTotalSize = sample => {
    return sum(map(file => file.size, sample.files));
  };

  const getNumFailedSamples = () => {
    if (uploadType === "local") {
      return size(getLocalSamplesFailed());
    } else {
      return failedSampleNames.length;
    }
  };

  const getLocalSamplesInProgress = () => {
    return filter(
      sample =>
        sampleUploadStatuses[sample.name] === undefined ||
        sampleUploadStatuses[sample.name] === "in progress",
      samples,
    );
  };

  const getLocalSamplesFailed = () => {
    return filter(
      sample => sampleUploadStatuses[sample.name] === "error",
      samples,
    );
  };

  const retryFailedSamplesUploadToS3 = failedSamples => {
    // We want to set { retryingSampleUpload: true } so the title gets updated right before the sample upload retry process
    setRetryingSampleUpload(true);
    setUploadComplete(false);

    const failedSamplesWithPresignedURLs = map(failedSample => {
      updateSampleUploadStatus(failedSample.name, "in progress");
      updateSampleUploadPercentage(failedSample.name, 0);

      return find({ name: failedSample.name }, locallyCreatedSamples);
    }, failedSamples);

    uploadSampleFilesToPresignedURL({
      samples: failedSamplesWithPresignedURLs,
      callbacks: getUploadProgressCallbacks(),
    });
  };

  const renderSampleStatus = ({ sample, status }) => {
    if (status === "error") {
      return (
        <React.Fragment>
          <IconAlert className={cs.alertIcon} type="error" />
          Upload failed
          <div className={cs.verticalDivider}> | </div>{" "}
          <div
            onClick={withAnalytics(
              () => retryFailedSamplesUploadToS3([sample]),
              "UploadProgressModal_retry_clicked",
              {
                sampleName: sample.name,
              },
            )}
            className={cs.sampleRetry}
          >
            Retry
          </div>
        </React.Fragment>
      );
    }

    if (status === "success") {
      return (
        <div className={cs.success}>
          <IconCheckSmall className={cs.checkmarkIcon} />
          Sent to pipeline
        </div>
      );
    }

    const uploadPercentage = getUploadPercentageForSample(sample);
    if (uploadPercentage === undefined) {
      return "Waiting to upload...";
    }

    const totalSize = getSampleTotalSize(sample);

    return `Uploaded ${formatFileSize(
      totalSize * uploadPercentage,
    )} of ${formatFileSize(totalSize)}`;
  };

  const renderFailedSamplesTitle = () => {
    const numFailedSamples = getNumFailedSamples();
    const title =
      Object.keys(sampleUploadStatuses).length === numFailedSamples
        ? "All uploads failed"
        : `Uploads completed with ${numFailedSamples} error${
            numFailedSamples > 1 ? "s" : ""
          }`;

    return (
      <React.Fragment>
        <div className={cs.titleWithIcon}>{title}</div>
        {numFailedSamples === size(samples) && (
          <div className={cs.subtitle}>
            <a
              className={cs.helpLink}
              href="mailto:help@czid.org"
              onClick={() =>
                logAnalyticsEvent("UploadProgressModal_contact-us-link_clicked")
              }
            >
              Contact us for help
            </a>
          </div>
        )}
      </React.Fragment>
    );
  };

  const renderTitle = () => {
    if (uploadType === "remote" || uploadType === "basespace") {
      if (uploadComplete) {
        // If any samples failed.
        if (failedSampleNames.length > 0) {
          return renderFailedSamplesTitle();
          // If all samples succeeded.
        } else {
          return (
            <React.Fragment>
              <div className={cs.titleWithIcon}>
                <IconSuccess className={cs.checkmarkIcon} />
                {samples.length} samples successfully created
              </div>
              <div className={cs.instructions}>
                We have started uploading your sample files from{" "}
                {uploadType === "basespace" ? "Basespace" : "S3"}. After the
                upload is complete, your samples will automatically start
                processing.
              </div>
            </React.Fragment>
          );
        }
      }
      // While samples are still being created.
      return (
        <React.Fragment>
          <div className={cs.title}>
            Creating {samples.length} sample{samples.length !== 1 && "s"} in{" "}
            {project.name}
          </div>
          <div className={cs.subtitle}>
            Stay on this page until upload completes.
          </div>
        </React.Fragment>
      );
    }

    const numLocalSamplesInProgress = size(getLocalSamplesInProgress());
    // While local samples are being uploaded.
    if (numLocalSamplesInProgress) {
      return (
        <React.Fragment>
          <div className={cs.title}>
            {retryingSampleUpload
              ? `Restarting ${numLocalSamplesInProgress} sample upload${
                  numLocalSamplesInProgress > 1 ? "s" : ""
                }`
              : `Uploading ${numLocalSamplesInProgress} sample${
                  numLocalSamplesInProgress > 1 ? "s" : ""
                } to ${project.name}`}
          </div>
          <div className={cs.subtitle}>
            Please stay on this page until upload completes! Closing your device
            or putting it to sleep will interrupt the upload.
          </div>
        </React.Fragment>
      );
    }

    // If any local samples failed.
    if (!isEmpty(getLocalSamplesFailed())) {
      return renderFailedSamplesTitle();
    }

    // If all local samples succeeded.
    return <div className={cs.titleWithIcon}>Uploads completed!</div>;
  };

  const renderRetryAllFailedNotification = () => {
    const localSamplesFailed = getLocalSamplesFailed();
    const numberOfLocalSamplesFailed = size(localSamplesFailed);

    return (
      <Notification
        className={cs.notificationContainer}
        type="error"
        displayStyle="flat"
      >
        <div className={cs.content}>
          <div className={cs.errorMessage}>
            {numberOfLocalSamplesFailed} upload
            {numberOfLocalSamplesFailed > 1 && "s"} ha
            {numberOfLocalSamplesFailed > 1 ? "ve" : "s"} failed
          </div>
          <div className={cs.fill} />
          <div
            className={cx(cs.sampleRetry, cs.retryAll)}
            onClick={withAnalytics(
              () => retryFailedSamplesUploadToS3(localSamplesFailed),
              "UploadProgressModal_retry-all-failed_clicked",
              {
                numberOfLocalSamplesFailed,
              },
            )}
          >
            Retry all failed
          </div>
        </div>
      </Notification>
    );
  };

  const renderSampleLoadingBar = ({ sample, status }) => {
    const uploadPercentage = getUploadPercentageForSample(sample);
    return (
      <LoadingBar percentage={uploadPercentage} error={status === "error"} />
    );
  };

  const redirectToProject = ({ useAnalytics = false } = {}) => {
    if (useAnalytics) {
      logAnalyticsEvent("UploadConfirmationModal_to-project-button_clicked", {
        numberOfTotalSamples: size(samples),
        numberOfFailedSamples: size(getLocalSamplesFailed),
      });
    }
    location.href = `/home?project_id=${project.id}`;
  };

  const renderViewProjectButton = () => {
    const buttonCallback = () => {
      logAnalyticsEvent("UploadProgressModal_to-project-button_clicked", {
        projectId: project.id,
        projectName: project.name,
      });

      if (!isEmpty(getLocalSamplesFailed())) {
        setConfirmationModalOpen(true);
      } else {
        redirectToProject();
      }
    };

    return (
      <PrimaryButton text="Go to Project" onClick={() => buttonCallback()} />
    );
  };

  return (
    <Modal
      open
      tall
      narrow
      className={cx(
        cs.uploadProgressModal,
        uploadComplete && cs.uploadComplete,
      )}
    >
      <div className={cs.header}>
        <ImgUploadPrimary className={cs.uploadImg} />
        {renderTitle()}
        {!isEmpty(getLocalSamplesFailed()) &&
          renderRetryAllFailedNotification()}
      </div>
      {uploadType === "local" && (
        <div className={cs.sampleList}>
          {samples.map(sample => {
            const status = sampleUploadStatuses[sample.name];

            return (
              <div key={sample.name} className={cs.sample}>
                <div className={cs.sampleHeader}>
                  <div className={cs.sampleName}>{sample.name}</div>
                  <div className={cs.fill} />
                  <div className={cs.sampleStatus}>
                    {renderSampleStatus({ sample, status })}
                  </div>
                </div>
                {renderSampleLoadingBar({ sample, status })}
              </div>
            );
          })}
        </div>
      )}
      {failedSampleNames.length > 0 && (
        <div className={cs.failedSamples}>
          Failed samples:{" "}
          {take(NUM_FAILED_SAMPLES_TO_DISPLAY, failedSampleNames).join(", ")}
          {failedSampleNames.length > NUM_FAILED_SAMPLES_TO_DISPLAY && (
            <span>
              ,&nbsp;and{" "}
              {failedSampleNames.length - NUM_FAILED_SAMPLES_TO_DISPLAY} more.
            </span>
          )}
        </div>
      )}
      {!retryingSampleUpload && uploadComplete && (
        <div className={cs.footer}>{renderViewProjectButton()}</div>
      )}
      {confirmationModalOpen && (
        <UploadConfirmationModal
          numberOfFailedSamples={getNumFailedSamples()}
          onCancel={setConfirmationModalOpen(false)}
          onConfirm={() => redirectToProject({ useAnalytics: true })}
          open
        />
      )}
    </Modal>
  );
};

UploadProgressModal.propTypes = {
  samples: PropTypes.arrayOf(
    PropTypes.shape({
      host_genome_id: PropTypes.number.isRequired,
      input_file_attributes: PropTypes.shape({
        name: PropTypes.string,
        source: PropTypes.string,
        source_type: PropTypes.string,
        upload_client: PropTypes.string,
      }),
      name: PropTypes.string,
      project_id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
      status: PropTypes.string,
      // Basespace samples only.
      file_size: PropTypes.number,
      file_type: PropTypes.string,
      basespace_project_name: PropTypes.string,
      files: PropTypes.objectOf(PropTypes.instanceOf(File)),
    }),
  ),
  adminOptions: PropTypes.objectOf(PropTypes.string).isRequired,
  clearlabs: PropTypes.bool,
  medakaModel: PropTypes.string,
  metadata: PropTypes.objectOf(PropTypes.any),
  onUploadComplete: PropTypes.func.isRequired,
  project: PropTypes.Project,
  skipSampleProcessing: PropTypes.bool,
  technology: PropTypes.string,
  uploadType: PropTypes.string.isRequired,
  useStepFunctionPipeline: PropTypes.bool,
  wetlabProtocol: PropTypes.string,
  workflows: PropTypes.instanceOf(Set),
};

export default UploadProgressModal;
