import React from "react";
import { IconSuccess } from "~/components/ui/icons";
import ImgUploadPrimary from "~/components/ui/illustrations/ImgUploadPrimary";
import { CONTACT_US_LINK } from "~/components/utils/documentationLinks";
import cs from "~/components/views/SampleUploadFlow/components/UploadProgressModal/upload_progress_modal.scss";

interface RemoteUploadModalHeaderProps {
  isUploadComplete: boolean;
  nFailedSamples: number;
  nSamples: number;
  projectName: string;
  uploadType: string;
}

export const RemoteUploadModalHeader = ({
  isUploadComplete,
  nFailedSamples,
  nSamples,
  projectName,
  uploadType,
}: RemoteUploadModalHeaderProps) => {
  const didAllUploadsFail = nSamples === nFailedSamples;

  return (
    <div className={cs.header}>
      <ImgUploadPrimary className={cs.uploadImg} />
      {/* The upload is in progress */}
      {!isUploadComplete && (
        <>
          <div className={cs.title}>
            Creating {nSamples} {nSamples === 1 ? "sample" : "samples"} in{" "}
            {projectName}
          </div>
          <div className={cs.subtitle}>
            Stay on this page until upload completes.
          </div>
        </>
      )}
      {/* The upload is complete and there were no errors */}
      {isUploadComplete && nFailedSamples === 0 && (
        <>
          <div className={cs.titleWithIcon}>
            <IconSuccess className={cs.checkmarkIcon} />
            {nSamples} samples successfully created
          </div>
          <div className={cs.instructions}>
            We have started uploading your sample files from{" "}
            {uploadType === "basespace" ? "Basespace" : "S3"}. After the upload
            is complete, your samples will automatically start processing.
          </div>
        </>
      )}
      {/* The upload is complete and there were errors */}
      {isUploadComplete && nFailedSamples > 0 && (
        <>
          <div className={cs.titleWithIcon}>
            {didAllUploadsFail
              ? "All uploads failed"
              : `Uploads completed with ${nFailedSamples} ${
                  nFailedSamples === 1 ? "error" : "errors"
                }`}
          </div>
          {didAllUploadsFail && (
            <div className={cs.subtitle}>
              <a
                className={cs.helpLink}
                href={CONTACT_US_LINK}
                target="_blank"
                rel="noreferrer"
              >
                Contact us for help
              </a>
            </div>
          )}
        </>
      )}
    </div>
  );
};
