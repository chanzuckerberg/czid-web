import cx from "classnames";
import {
  isEmpty,
  filter,
  map,
  sum,
  zipObject,
  times,
  constant,
  size,
  find,
} from "lodash/fp";
import React, { useEffect, useState } from "react";
import { logAnalyticsEvent, withAnalytics } from "~/api/analytics";
import {
  initiateBulkUploadLocalWithMetadata,
  uploadSampleFilesToPresignedURL,
} from "~/api/upload";
import LoadingBar from "~/components/ui/controls/LoadingBar";
import PrimaryButton from "~/components/ui/controls/buttons/PrimaryButton";
import { formatFileSize } from "~/components/utils/format";
import { logError } from "~/components/utils/logUtil";
import PropTypes from "~/components/utils/propTypes";
import Modal from "~ui/containers/Modal";
import { IconAlert, IconCheckSmall } from "~ui/icons";
import ImgUploadPrimary from "~ui/illustrations/ImgUploadPrimary";
import Notification from "~ui/notifications/Notification";
import UploadConfirmationModal from "./UploadConfirmationModal";
import cs from "./upload_progress_modal.scss";
import {
  addFlagsToSamples,
  logUploadStepError,
  redirectToProject,
} from "./upload_progress_utils";

const LocalUploadProgressModal = ({
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

  const [sampleUploadPercentages, setSampleUploadPercentages] = useState({});
  const [sampleUploadStatuses, setSampleUploadStatuses] = useState({});
  const [uploadComplete, setUploadComplete] = useState(false);

  useEffect(() => {
    initiateUploadLocal();
  }, []);

  useEffect(() => {
    // For local uploads, check if all samples are completed whenever sampleUploadStatuses changes.
    if (!uploadComplete && isEmpty(getLocalSamplesInProgress())) {
      onUploadComplete();
      setUploadComplete(true);
      setRetryingSampleUpload(false);

      if (!isEmpty(getLocalSamplesFailed())) {
        const failedSamples = filter(
          sample => sampleUploadStatuses[sample.name] === "error",
          samples,
        );
        logAnalyticsEvent("UploadProgressModal_upload_failed", {
          erroredSamples: failedSamples.length,
          createdSamples: samples.length - failedSamples.length,
          uploadType,
        });
      } else {
        logAnalyticsEvent("UploadProgressModal_upload_succeeded", {
          createdSamples: samples.length,
          uploadType,
        });
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
        logUploadStepError({
          step: "sampleUpload",
          erroredSamples: 1,
          uploadType,
        });
      },
      onSampleUploadSuccess: sample => {
        updateSampleUploadStatus(sample.name, "success");
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
        logUploadStepError({
          step: "markSampleUploaded",
          erroredSamples: 1,
          uploadType,
        });
      },
    };
  };

  const initiateUploadLocal = () => {
    const samplesToUpload = addFlagsToSamples({
      adminOptions,
      clearlabs,
      medakaModel,
      samples,
      useStepFunctionPipeline,
      skipSampleProcessing,
      technology,
      workflows,
      wetlabProtocol,
    });

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

          logUploadStepError({
            step: "createSamples",
            erroredSamples: erroredSampleNames.length,
            uploadType,
          });
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

  const getUploadPercentageForSample = sample => {
    return sampleUploadPercentages[sample.name];
  };

  const getNumFailedSamples = () => size(getLocalSamplesFailed());

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
        <>
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
        </>
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

    const totalSize = sum(map(file => file.size, sample.files));
    return `Uploaded ${formatFileSize(
      totalSize * uploadPercentage,
    )} of ${formatFileSize(totalSize)}`;
  };

  const uploadInProgressTitle = () => {
    const numLocalSamplesInProgress = size(getLocalSamplesInProgress());
    const pluralSuffix = numLocalSamplesInProgress > 1 ? "s" : "";

    return (
      <>
        <div className={cs.title}>
          {retryingSampleUpload
            ? `Restarting ${numLocalSamplesInProgress} sample upload${pluralSuffix}`
            : `Uploading ${numLocalSamplesInProgress} sample${pluralSuffix} to ${project.name}`}
        </div>
        <div className={cs.subtitle}>
          Please stay on this page until upload completes! Closing your device
          or putting it to sleep will interrupt the upload.
        </div>
      </>
    );
  };

  const failedSamplesTitle = () => {
    const numFailedSamples = getNumFailedSamples();
    const title =
      Object.keys(sampleUploadStatuses).length === numFailedSamples
        ? "All uploads failed"
        : `Uploads completed with ${numFailedSamples} error${
            numFailedSamples > 1 ? "s" : ""
          }`;

    return (
      <>
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
      </>
    );
  };

  const renderTitle = () => {
    const numLocalSamplesInProgress = size(getLocalSamplesInProgress());
    // While local samples are being uploaded.
    if (numLocalSamplesInProgress) {
      return uploadInProgressTitle();
    } else if (!isEmpty(getLocalSamplesFailed())) {
      return failedSamplesTitle();
    } else {
      return <div className={cs.titleWithIcon}>Uploads completed!</div>;
    }
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

  const renderViewProjectButton = () => {
    const buttonCallback = () => {
      logAnalyticsEvent("UploadProgressModal_to-project-button_clicked", {
        projectId: project.id,
        projectName: project.name,
      });
      if (!isEmpty(getLocalSamplesFailed())) {
        setConfirmationModalOpen(true);
      } else {
        redirectToProject(project.id);
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
              <LoadingBar
                percentage={getUploadPercentageForSample(sample)}
                error={status === "error"}
              />
            </div>
          );
        })}
      </div>
      {!retryingSampleUpload && uploadComplete && (
        <div className={cs.footer}>{renderViewProjectButton()}</div>
      )}
      {confirmationModalOpen && (
        <UploadConfirmationModal
          numberOfFailedSamples={getNumFailedSamples()}
          onCancel={() => setConfirmationModalOpen(false)}
          onConfirm={() => {
            logAnalyticsEvent(
              "UploadConfirmationModal_to-project-button_clicked",
              {
                numberOfTotalSamples: size(samples),
                numberOfFailedSamples: size(getLocalSamplesFailed),
              },
            );

            redirectToProject(project.id);
          }}
          open
        />
      )}
    </Modal>
  );
};

LocalUploadProgressModal.propTypes = {
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

export default LocalUploadProgressModal;
