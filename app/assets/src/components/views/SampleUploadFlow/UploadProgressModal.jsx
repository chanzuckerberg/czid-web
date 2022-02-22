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
import React from "react";
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

export default class UploadProgressModal extends React.Component {
  state = {
    confirmationModalOpen: false,
    locallyCreatedSamples: [],
    retryingSampleUpload: false,
    // For local uploads.
    sampleUploadPercentages: {},
    sampleUploadStatuses: {},
    uploadComplete: false,
    // For remote and basespace uploads. Failures for local samples are stored in sampleUploadStatuses.
    failedSampleNames: [],
  };

  componentDidUpdate() {
    const { samples, onUploadComplete, uploadType } = this.props;
    const {
      uploadComplete,
      sampleUploadStatuses,
      retryingSampleUpload,
    } = this.state;

    // For local uploads, check if all samples are completed whenever sampleUploadStatuses changes.
    if (
      uploadType === "local" &&
      !uploadComplete &&
      !retryingSampleUpload &&
      isEmpty(this.getLocalSamplesInProgress())
    ) {
      onUploadComplete();

      this.setState({
        uploadComplete: true,
      });

      if (!isEmpty(this.getLocalSamplesFailed())) {
        const failedSamples = filter(
          sample => sampleUploadStatuses[sample.name] === "error",
          samples,
        );
        this.logUploadFailed(
          failedSamples.length,
          samples.length - failedSamples.length,
        );
      } else {
        this.logUploadSucceeded(samples.length);
      }
    }
  }

  // Kick off the upload as soon as the modal is opened.
  componentDidMount() {
    const { uploadType } = this.props;

    if (uploadType === "local") {
      this.initiateUploadLocal();
    } else {
      this.initiateUpload();
    }
  }

  updateSampleUploadStatus = (sampleName, status) => {
    // Use function version of setState since this function can be called in rapid succession.
    this.setState(prevState => ({
      ...prevState,
      sampleUploadStatuses: {
        ...prevState.sampleUploadStatuses,
        [sampleName]: status,
      },
    }));
  };

  updateSampleUploadPercentage = (sampleName, percentage) => {
    // Use function version of setState since this function can be called in rapid succession.
    this.setState(prevState => ({
      ...prevState,
      sampleUploadPercentages: {
        ...prevState.sampleUploadPercentages,
        [sampleName]: percentage,
      },
    }));
  };

  // Add any flags selected by the user in the Review Step.
  addFlagsToSamples = samples => {
    const {
      adminOptions,
      clearlabs,
      medakaModel,
      technology,
      skipSampleProcessing,
      useStepFunctionPipeline,
      wetlabProtocol,
      workflows,
    } = this.props;

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

  checkIfRetriedSamplesCompleted = () => {
    const { retryingSampleUpload } = this.state;

    if (retryingSampleUpload && isEmpty(this.getLocalSamplesInProgress())) {
      this.setState({ retryingSampleUpload: false, uploadComplete: true });
    }
  };

  getUploadProgressCallbacks = () => {
    return {
      onSampleUploadProgress: (sample, percentage) => {
        this.updateSampleUploadPercentage(sample.name, percentage);
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
        this.updateSampleUploadStatus(sample.name, "error");
        this.checkIfRetriedSamplesCompleted();
        this.logUploadStepError("sampleUpload", 1);
      },
      onSampleUploadSuccess: sample => {
        this.updateSampleUploadStatus(sample.name, "success");
        this.checkIfRetriedSamplesCompleted();
      },
      onMarkSampleUploadedError: sample => {
        logError({
          message:
            "UploadProgressModal: An error occured when marking a sample as uploaded",
          details: {
            sample,
          },
        });
        this.updateSampleUploadStatus(sample.name, "error");
        this.checkIfRetriedSamplesCompleted();
        this.logUploadStepError("markSampleUploaded", 1);
      },
    };
  };

  initiateUploadLocal = () => {
    const { metadata, samples } = this.props;

    const samplesToUpload = this.addFlagsToSamples(samples);

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

          this.setState(prevState => ({
            ...prevState,
            sampleUploadStatuses: {
              ...prevState.sampleUploadStatuses,
              ...uploadStatuses,
            },
          }));

          this.logUploadStepError("createSamples", erroredSampleNames.length);
        },
      },
    }).then(createdSamples =>
      this.setState(
        {
          locallyCreatedSamples: createdSamples,
        },
        () =>
          uploadSampleFilesToPresignedURL({
            samples: createdSamples,
            callbacks: this.getUploadProgressCallbacks(),
          }),
      ),
    );
  };

  // Initiate upload for s3 and basespace samples.
  initiateUpload = async () => {
    const { onUploadComplete, uploadType, samples, metadata } = this.props;

    let bulkUploadFn = bulkUploadRemote;
    let bulkUploadFnName = "bulkUploadRemote";
    let samplesToUpload = samples;

    if (uploadType === "basespace") {
      bulkUploadFn = bulkUploadBasespace;
      bulkUploadFnName = "bulkUploadBasespace";
      samplesToUpload = map(pick(BASESPACE_SAMPLE_FIELDS), samplesToUpload);
    }

    samplesToUpload = this.addFlagsToSamples(samplesToUpload);

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
      this.setState({
        uploadComplete: true,
        failedSampleNames: map("name", samples),
      });
      this.logUploadFailed(samples.length, 0);
      return;
    }

    this.setState({
      uploadComplete: true,
      failedSampleNames: response.errored_sample_names || [],
    });
    onUploadComplete();

    if (response.errors.length > 0) {
      this.logUploadFailed(
        response.errored_sample_names.length,
        response.sample_ids.length,
      );
    } else {
      this.logUploadSucceeded(response.sample_ids.length);
    }
  };

  // Log an error in a particular step of the upload process.
  // Only applies to local uploads.
  logUploadStepError = (step, erroredSamples) => {
    const { uploadType } = this.props;
    logAnalyticsEvent("UploadProgressModal_upload-step_error", {
      erroredSamples,
      step,
      uploadType,
    });
  };

  logUploadFailed = (erroredSamples, createdSamples) => {
    const { uploadType } = this.props;
    logAnalyticsEvent("UploadProgressModal_upload_failed", {
      erroredSamples,
      createdSamples,
      uploadType,
    });
  };

  logUploadSucceeded = createdSamples => {
    const { uploadType } = this.props;
    logAnalyticsEvent("UploadProgressModal_upload_succeeded", {
      createdSamples,
      uploadType,
    });
  };

  getSampleUploadPercentage = sample => {
    return this.state.sampleUploadPercentages[sample.name];
  };

  getSampleTotalSize = sample => {
    return sum(map(file => file.size, sample.files));
  };

  getNumFailedSamples = () => {
    const { uploadType } = this.props;
    const { failedSampleNames } = this.state;
    if (uploadType === "local") {
      return size(this.getLocalSamplesFailed());
    } else {
      return failedSampleNames.length;
    }
  };

  getLocalSamplesInProgress = () => {
    const { samples } = this.props;
    const { sampleUploadStatuses } = this.state;
    return filter(
      sample =>
        sampleUploadStatuses[sample.name] === undefined ||
        sampleUploadStatuses[sample.name] === "in progress",
      samples,
    );
  };

  getLocalSamplesFailed = () => {
    const { samples } = this.props;
    const { sampleUploadStatuses } = this.state;
    return filter(
      sample => sampleUploadStatuses[sample.name] === "error",
      samples,
    );
  };

  retryFailedSamplesUploadToS3 = failedSamples => {
    const { locallyCreatedSamples } = this.state;

    // We want to set { retryingSampleUpload: true } so the title gets updated right before the sample upload retry process
    this.setState(
      {
        retryingSampleUpload: true,
        uploadComplete: false,
      },
      () => {
        // Finds the corresponding sample from locallyCreatedSamples and marks it as in progress with an upload percentage of 0
        // This is necessary because the locallyCreatedSamples all have the presigned S3 URL whereas the samples passed in via props does not
        const failedSamplesWithPresignedURLs = map(failedSample => {
          this.updateSampleUploadStatus(failedSample.name, "in progress");
          this.updateSampleUploadPercentage(failedSample.name, 0);

          return find({ name: failedSample.name }, locallyCreatedSamples);
        }, failedSamples);

        uploadSampleFilesToPresignedURL({
          samples: failedSamplesWithPresignedURLs,
          callbacks: this.getUploadProgressCallbacks(),
        });
      },
    );
  };

  renderSampleStatus = ({ sample, status }) => {
    if (status === "error") {
      return (
        <React.Fragment>
          <IconAlert className={cs.alertIcon} type="error" />
          Upload failed
          <div className={cs.verticalDivider}> | </div>{" "}
          <div
            onClick={withAnalytics(
              () => this.retryFailedSamplesUploadToS3([sample]),
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

    const uploadPercentage = this.getSampleUploadPercentage(sample);
    if (uploadPercentage === undefined) {
      return "Waiting to upload...";
    }

    const totalSize = this.getSampleTotalSize(sample);

    return `Uploaded ${formatFileSize(
      totalSize * uploadPercentage,
    )} of ${formatFileSize(totalSize)}`;
  };

  renderFailedSamplesTitle = () => {
    const { samples } = this.props;
    const { sampleUploadStatuses } = this.state;

    const numFailedSamples = this.getNumFailedSamples();
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

  renderTitle = () => {
    const { samples, project, uploadType } = this.props;
    const {
      uploadComplete,
      failedSampleNames,
      retryingSampleUpload,
    } = this.state;

    if (uploadType === "remote" || uploadType === "basespace") {
      if (uploadComplete) {
        // If any samples failed.
        if (failedSampleNames.length > 0) {
          return this.renderFailedSamplesTitle();
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

    const numLocalSamplesInProgress = size(this.getLocalSamplesInProgress());
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
    if (!isEmpty(this.getLocalSamplesFailed())) {
      return this.renderFailedSamplesTitle();
    }

    // If all local samples succeeded.
    return <div className={cs.titleWithIcon}>Uploads completed!</div>;
  };

  renderRetryAllFailedNotification = () => {
    const localSamplesFailed = this.getLocalSamplesFailed();
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
              () => this.retryFailedSamplesUploadToS3(localSamplesFailed),
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

  renderSampleLoadingBar = ({ sample, status }) => {
    const uploadPercentage = this.getSampleUploadPercentage(sample);
    return (
      <LoadingBar percentage={uploadPercentage} error={status === "error"} />
    );
  };

  handleConfirmationModalOpen = () =>
    this.setState({ confirmationModalOpen: true });

  handleConfirmationModalClose = () =>
    this.setState({ confirmationModalOpen: false });

  redirectToProject = ({ useAnalytics = false } = {}) => {
    const { samples, project } = this.props;

    if (useAnalytics) {
      logAnalyticsEvent("UploadConfirmationModal_to-project-button_clicked", {
        numberOfTotalSamples: size(samples),
        numberOfFailedSamples: size(this.getLocalSamplesFailed),
      });
    }
    location.href = `/home?project_id=${project.id}`;
  };

  renderViewProjectButton = () => {
    const { project } = this.props;

    const buttonCallback = () => {
      logAnalyticsEvent("UploadProgressModal_to-project-button_clicked", {
        projectId: project.id,
        projectName: project.name,
      });

      if (!isEmpty(this.getLocalSamplesFailed())) {
        this.handleConfirmationModalOpen();
      } else {
        this.redirectToProject();
      }
    };

    return (
      <PrimaryButton text="Go to Project" onClick={() => buttonCallback()} />
    );
  };

  render() {
    const { samples, uploadType } = this.props;
    const {
      confirmationModalOpen,
      failedSampleNames,
      retryingSampleUpload,
      uploadComplete,
      sampleUploadStatuses,
    } = this.state;

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
          {this.renderTitle()}
          {!isEmpty(this.getLocalSamplesFailed()) &&
            this.renderRetryAllFailedNotification()}
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
                      {this.renderSampleStatus({ sample, status })}
                    </div>
                  </div>
                  {this.renderSampleLoadingBar({ sample, status })}
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
          <div className={cs.footer}>{this.renderViewProjectButton()}</div>
        )}
        {confirmationModalOpen && (
          <UploadConfirmationModal
            numberOfFailedSamples={this.getNumFailedSamples()}
            onCancel={this.handleConfirmationModalClose}
            onConfirm={() => this.redirectToProject({ useAnalytics: true })}
            open
          />
        )}
      </Modal>
    );
  }
}

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
