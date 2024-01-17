import cx from "classnames";
import React from "react";
import ImgUploadPrimary from "~/components/ui/illustrations/ImgUploadPrimary";
import { CONTACT_US_LINK } from "~/components/utils/documentationLinks";
import { SampleFromApi } from "~/interface/shared";
import Notification from "~ui/notifications/Notification";
import cs from "../../../../upload_progress_modal.scss";

interface LocalUploadModalHeaderProps {
  hasFailedSamples: boolean;
  numberOfFailedSamples: number;
  localSamplesFailed: SampleFromApi[];
  numLocalSamplesInProgress: number;
  retryFailedSampleUploads: (samples: SampleFromApi[]) => void;
  retryingSampleUpload: boolean;
  sampleUploadStatuses: any;
  numberOfSamples: number;
  projectName: string;
}

export const LocalUploadModalHeader = ({
  hasFailedSamples,
  numberOfFailedSamples,
  localSamplesFailed,
  numLocalSamplesInProgress,
  retryFailedSampleUploads,
  retryingSampleUpload,
  sampleUploadStatuses,
  numberOfSamples,
  projectName,
}: LocalUploadModalHeaderProps) => {
  const pluralSuffix = numLocalSamplesInProgress > 1 ? "s" : "";
  const allSamplesFailedToUpload =
    Object.keys(sampleUploadStatuses).length === numberOfFailedSamples;
  const inProgessTitle = retryingSampleUpload
    ? `Retrying ${numLocalSamplesInProgress} sample upload${pluralSuffix}`
    : `Uploading ${numLocalSamplesInProgress} sample${pluralSuffix} to ${projectName}`;
  const failedSamplesTitle = allSamplesFailedToUpload
    ? "All uploads failed"
    : `Uploads completed with ${numberOfFailedSamples} error${
        numberOfFailedSamples > 1 ? "s" : ""
      }`;
  const isInProgressMode = numLocalSamplesInProgress;
  const isInFailedMode = !numLocalSamplesInProgress && hasFailedSamples;
  const isInCompletedMode = !numLocalSamplesInProgress && !hasFailedSamples;
  return (
    <div className={cs.header}>
      <ImgUploadPrimary className={cs.uploadImg} />
      {isInCompletedMode ? (
        <div className={cs.titleWithIcon}>Uploads completed!</div>
      ) : (
        <>
          <div
            className={cx(
              { [cs.title]: isInProgressMode },
              { [cs.titleWithIcon]: isInFailedMode },
            )}
          >
            {isInProgressMode && inProgessTitle}
            {isInFailedMode && failedSamplesTitle}
          </div>
          <div className={cs.subtitle}>
            {isInProgressMode && (
              <>
                Please stay on this page until upload completes! Closing your
                device or putting it to sleep will interrupt the upload.
              </>
            )}
            {isInFailedMode && numberOfFailedSamples === numberOfSamples && (
              <a
                className={cs.helpLink}
                href={CONTACT_US_LINK}
                target="_blank"
                rel="noopener noreferrer"
              >
                Contact us for help
              </a>
            )}
          </div>
        </>
      )}
      {hasFailedSamples && (
        <Notification
          className={cs.notificationContainer}
          type="error"
          displayStyle="flat"
        >
          <div className={cs.content}>
            <div className={cs.errorMessage}>
              {numberOfFailedSamples} upload
              {numberOfFailedSamples > 1 && "s"} ha
              {numberOfFailedSamples > 1 ? "ve" : "s"} failed
            </div>
            <div
              className={cx(cs.sampleRetry, cs.retryAll)}
              onClick={() => retryFailedSampleUploads(localSamplesFailed)}
            >
              Retry all failed
            </div>
          </div>
        </Notification>
      )}
    </div>
  );
};
