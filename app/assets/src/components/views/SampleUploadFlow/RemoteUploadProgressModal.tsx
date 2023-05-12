import cx from "classnames";
import { map, pick, size, take } from "lodash/fp";
import React, { useEffect, useState } from "react";
import {
  ANALYTICS_EVENT_NAMES,
  trackEvent,
  withAnalytics,
} from "~/api/analytics";
import { bulkUploadBasespace, bulkUploadRemote } from "~/api/upload";
import { TaxonOption } from "~/components/common/filters/types";
import PrimaryButton from "~/components/ui/controls/buttons/PrimaryButton";
import { logError } from "~/components/utils/logUtil";
import { Project, SampleFromApi } from "~/interface/shared";
import Modal from "~ui/containers/Modal";
import { IconSuccess } from "~ui/icons";
import ImgUploadPrimary from "~ui/illustrations/ImgUploadPrimary";
import { RefSeqAccessionDataType } from "./components/UploadSampleStep/types";
import cs from "./upload_progress_modal.scss";
import { addFlagsToSamples, redirectToProject } from "./upload_progress_utils";

const BASESPACE_SAMPLE_FIELDS = [
  "name",
  "project_id",
  "host_genome_id",
  "basespace_access_token",
  "basespace_dataset_id",
];

const NUM_FAILED_SAMPLES_TO_DISPLAY = 3;

interface RemoteUploadProgressModalProps {
  adminOptions: Record<string, string>;
  bedFile?: File;
  clearlabs?: boolean;
  medakaModel?: string;
  metadata?: Record<string, any>;
  onUploadComplete: $TSFixMeFunction;
  project?: Project;
  refSeqAccession?: RefSeqAccessionDataType;
  refSeqFile?: File;
  refSeqTaxon?: TaxonOption;
  samples?: SampleFromApi[];
  skipSampleProcessing?: boolean;
  technology?: string;
  uploadType: string;
  useStepFunctionPipeline?: boolean;
  wetlabProtocol?: string;
  workflows?: Set<string>;
}

const RemoteUploadProgressModal = ({
  adminOptions,
  bedFile,
  clearlabs,
  technology,
  medakaModel,
  metadata,
  onUploadComplete,
  project,
  refSeqAccession,
  refSeqFile,
  refSeqTaxon,
  samples,
  skipSampleProcessing,
  uploadType,
  useStepFunctionPipeline,
  wetlabProtocol,
  workflows,
}: RemoteUploadProgressModalProps) => {
  const [uploadComplete, setUploadComplete] = useState(false);
  const [samplesToUpload, setSamplesToUpload] = useState([]);
  const [failedSampleNames, setFailedSampleNames] = useState([]);

  useEffect(() => {
    initiateRemoteUpload();
  }, []);

  const initiateRemoteUpload = async () => {
    let bulkUploadFn;
    let bulkUploadFnName;
    let samplesToFlag;

    if (uploadType === "remote") {
      bulkUploadFn = bulkUploadRemote;
      bulkUploadFnName = "bulkUploadRemote";
      samplesToFlag = samples;
    } else if (uploadType === "basespace") {
      bulkUploadFn = bulkUploadBasespace;
      bulkUploadFnName = "bulkUploadBasespace";
      samplesToFlag = map(pick(BASESPACE_SAMPLE_FIELDS), samples);
    } else {
      logError({
        message: `Invalid upload type '${uploadType}' for remote upload modal`,
      });
    }

    const samplesWithFlags = addFlagsToSamples({
      adminOptions,
      bedFileName: bedFile?.name,
      clearlabs,
      medakaModel,
      useStepFunctionPipeline,
      refSeqAccession,
      refSeqFileName: refSeqFile?.name,
      refSeqTaxon,
      samples: samplesToFlag,
      skipSampleProcessing,
      technology,
      workflows,
      wetlabProtocol,
    });

    setSamplesToUpload(samplesWithFlags);

    let response: {
      errored_sample_names: $TSFixMeUnknown[];
      errors: $TSFixMeUnknown[];
      sample_ids: $TSFixMeUnknown[];
    };
    try {
      response = await bulkUploadFn({
        samples: samplesWithFlags,
        metadata,
      });
    } catch (error) {
      logError({
        message: `UploadProgressModal: ${bulkUploadFnName} error`,
        details: { error },
      });

      setUploadComplete(true);
      setFailedSampleNames(map("name", samples));

      trackEvent(
        ANALYTICS_EVENT_NAMES.REMOTE_UPLOAD_PROGRESS_MODAL_UPLOAD_FAILED,
        {
          erroredSamples: samplesWithFlags.length,
          createdSamples: 0,
          uploadType,
        },
      );
      return;
    }

    setUploadComplete(true);
    setFailedSampleNames(response.errored_sample_names || []);

    onUploadComplete();

    if (response.errors.length > 0) {
      trackEvent(
        ANALYTICS_EVENT_NAMES.REMOTE_UPLOAD_PROGRESS_MODAL_UPLOAD_FAILED,
        {
          erroredSamples: response.errored_sample_names.length,
          createdSamples: response.sample_ids.length,
          uploadType,
        },
      );
    } else {
      trackEvent(
        ANALYTICS_EVENT_NAMES.REMOTE_UPLOAD_PROGRESS_MODAL_UPLOAD_SUCCEEDED,
        {
          createdSamples: response.sample_ids.length,
          uploadType,
        },
      );
    }
  };

  const getNumFailedSamples = () => failedSampleNames.length;

  const failedSamplesTitle = () => {
    const numFailedSamples = getNumFailedSamples();
    const title =
      samplesToUpload.length === numFailedSamples
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
                trackEvent(
                  ANALYTICS_EVENT_NAMES.REMOTE_UPLOAD_PROGRESS_MODAL_CONTACT_US_LINK_CLICKED,
                )
              }
            >
              Contact us for help
            </a>
          </div>
        )}
      </>
    );
  };

  const createdSamplesTitle = () => (
    <>
      <div className={cs.titleWithIcon}>
        <IconSuccess className={cs.checkmarkIcon} />
        {samples.length} samples successfully created
      </div>
      <div className={cs.instructions}>
        We have started uploading your sample files from{" "}
        {uploadType === "basespace" ? "Basespace" : "S3"}. After the upload is
        complete, your samples will automatically start processing.
      </div>
    </>
  );

  const uploadInProgressTitle = () => (
    <>
      <div className={cs.title}>
        Creating {samples.length} sample{samples.length !== 1 && "s"} in{" "}
        {project.name}
      </div>
      <div className={cs.subtitle}>
        Stay on this page until upload completes.
      </div>
    </>
  );

  const renderTitle = () => {
    if (uploadComplete) {
      if (failedSampleNames.length > 0) {
        return failedSamplesTitle();
      } else {
        return createdSamplesTitle();
      }
    } else {
      return uploadInProgressTitle();
    }
  };

  const renderViewProjectButton = () => {
    const buttonCallback = () => {
      withAnalytics(
        redirectToProject(project.id),
        ANALYTICS_EVENT_NAMES.REMOTE_UPLOAD_PROGRESS_MODAL_GO_TO_PROJECT_BUTTON_CLICKED,
        {
          projectId: project.id,
          projectName: project.name,
        },
      );
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
      </div>
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
      {uploadComplete && (
        <div className={cs.footer}>{renderViewProjectButton()}</div>
      )}
    </Modal>
  );
};

export default RemoteUploadProgressModal;
