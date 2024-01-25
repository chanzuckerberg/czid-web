import { ChecksumAlgorithm, S3Client } from "@aws-sdk/client-s3";
import { Upload } from "@aws-sdk/lib-storage";
import cx from "classnames";
import {
  constant,
  filter,
  isEmpty,
  map,
  omit,
  size,
  sum,
  times,
  zipObject,
} from "lodash/fp";
import React, { useEffect, useState } from "react";
import { ANALYTICS_EVENT_NAMES, useTrackEvent } from "~/api/analytics";
import {
  completeSampleUpload,
  getUploadCredentials,
  initiateBulkUploadLocalWithMetadata,
  startUploadHeartbeat,
} from "~/api/upload";
import { TaxonOption } from "~/components/common/filters/types";
import PrimaryButton from "~/components/ui/controls/buttons/PrimaryButton";
import { logError } from "~/components/utils/logUtil";
import { MetadataBasic, Project, SampleFromApi } from "~/interface/shared";
import Modal from "~ui/containers/Modal";
import { UploadWorkflows } from "../../../../constants";
import { RefSeqAccessionDataType } from "../../../UploadSampleStep/types";
import { PathToFile, SampleForUpload } from "../../types";
import cs from "../../upload_progress_modal.scss";
import {
  addAdditionalInputFilesToSamples,
  addFlagsToSamples,
  redirectToProject,
} from "../../upload_progress_utils";
import { LocalUploadModalHeader } from "./components/LocalUploadModalHeader";
import { UploadConfirmationModal } from "./components/UploadConfirmationModal";
import { UploadProgressModalSampleList } from "./components/UploadProgressModalSampleList";

interface LocalUploadProgressModalProps {
  adminOptions: Record<string, string>;
  bedFile: File | null;
  clearlabs: boolean;
  guppyBasecallerSetting: string;
  medakaModel: string | null;
  metadata: MetadataBasic | null;
  onUploadComplete: () => void;
  project: Project;
  refSeqAccession: RefSeqAccessionDataType | null;
  refSeqFile: File | null;
  refSeqTaxon: TaxonOption | null;
  samples: SampleFromApi[] | null;
  skipSampleProcessing: boolean;
  technology: string | null;
  uploadType: string;
  useStepFunctionPipeline: boolean;
  wetlabProtocol: string | null;
  workflows: Set<UploadWorkflows>;
}

export const LocalUploadProgressModal = ({
  adminOptions,
  bedFile,
  clearlabs,
  guppyBasecallerSetting,
  medakaModel,
  metadata,
  onUploadComplete,
  project,
  refSeqAccession,
  refSeqFile,
  refSeqTaxon,
  samples,
  skipSampleProcessing,
  technology,
  useStepFunctionPipeline,
  wetlabProtocol,
  workflows,
}: LocalUploadProgressModalProps) => {
  const trackEvent = useTrackEvent();
  const [confirmationModalOpen, setConfirmationModalOpen] = useState(false);

  // State variables to manage download state
  const [retryingSampleUpload, setRetryingSampleUpload] = useState(false);
  const [uploadComplete, setUploadComplete] = useState(false);

  // Store samples created in API
  const [locallyCreatedSamples, setLocallyCreatedSamples] = useState<
    SampleForUpload[]
  >([]);

  // State to track download progress
  const [sampleFileUploadIds, setSampleFileUploadIds] = useState({});
  const [sampleUploadPercentages, setSampleUploadPercentages] = useState({});
  const [sampleUploadStatuses, setSampleUploadStatuses] = useState({});
  const [sampleFileCompleted, setSampleFileCompleted] = useState({});

  let sampleFilePercentages = {};
  let wakeLock: WakeLockSentinel | null = null;
  let heartbeatInterval: NodeJS.Timer | null = null;

  const IN_PROGRESS_STATUS = "in progress";
  const ERROR_STATUS = "error";

  useEffect(() => {
    initiateLocalUpload();

    // If navigate back to tab, re-acquire wake lock
    document.addEventListener("visibilitychange", async () => {
      if (wakeLock !== null && document.visibilityState === "visible") {
        await acquireScreenLock();
      }
    });
  }, []);

  useEffect(() => {
    const uploadsInProgress = !isEmpty(getLocalSamplesInProgress());
    if (uploadComplete || uploadsInProgress) return;

    completeLocalUpload();
  }, [sampleUploadStatuses]);

  // Try to prevent the computer going to sleep during upload; this can be rejected e.g. if the battery is low
  const acquireScreenLock = async () => {
    try {
      if ("wakeLock" in navigator) {
        wakeLock = await navigator.wakeLock.request("screen");
        wakeLock.addEventListener("release", () => {
          console.warn("Wake lock was released");
        });
      } else {
        throw new Error("WakeLock API not supported in this browser");
      }
      console.warn("Acquired wake lock");
    } catch (err) {
      console.error("Failed to acquire wake lock");
      console.error(err);
    }
  };

  const initiateLocalUpload = async () => {
    if (!samples) return;
    const samplesToUpload = addFlagsToSamples({
      adminOptions,
      bedFileName: bedFile?.name,
      clearlabs,
      guppyBasecallerSetting,
      medakaModel,
      samples,
      useStepFunctionPipeline,
      refSeqAccession,
      refSeqFileName: refSeqFile?.name,
      refSeqTaxon,
      skipSampleProcessing,
      technology,
      workflows,
      wetlabProtocol,
    });

    addAdditionalInputFilesToSamples({
      samples: samplesToUpload,
      bedFile,
      refSeqFile,
    });
    // Create the samples in the db; this does NOT upload files to s3
    const createdSamples = await initiateBulkUploadLocalWithMetadata({
      samples: samplesToUpload,
      metadata,
      onCreateSamplesError: (
        errors: $TSFixMeUnknown,
        erroredSampleNames: string[],
      ) => {
        logError({
          message: "UploadProgressModal: onCreateSamplesError",
          details: { errors },
        });

        const uploadStatuses = zipObject(
          erroredSampleNames,
          times(constant(ERROR_STATUS), erroredSampleNames.length),
        );

        setSampleUploadStatuses(prevState => ({
          ...prevState,
          ...uploadStatuses,
        }));
      },
    });

    setLocallyCreatedSamples(createdSamples);

    await acquireScreenLock();

    // For each sample, upload sample.input_files to s3
    // Also handles the upload progress bar for each sample
    await uploadSamples(createdSamples);
  };

  const uploadSamples = async (samples: SampleForUpload[]) => {
    // Ping a heartbeat periodically to say the browser is actively uploading the samples.
    heartbeatInterval = await startUploadHeartbeat();

    // Upload each sample in serial, but upload each sample's input files and parts in parallel.
    // if we upload samples in parallel, we fetch AWS credentials for many samples at once at
    // the beginning, so by the time we get to the last sample, the credentials could have expired.
    for (const sample of samples) {
      await uploadSample(sample);
    }

    // Once the upload is done, release the wake lock
    if (wakeLock !== null) {
      console.warn("Releasing wake lock since upload completed...");
      await wakeLock.release();
      wakeLock = null;
    }

    clearInterval(heartbeatInterval);
    trackEvent(
      ANALYTICS_EVENT_NAMES.LOCAL_UPLOAD_PROGRESS_MODAL_UPLOADS_BATCH_HEARTBEAT_COMPLETED,
      {
        sampleIds: JSON.stringify(map("id", samples)),
      },
    );
  };

  const uploadSample = async (sample: SampleForUpload) => {
    try {
      // Get the credentials for the sample
      const s3ClientForSample = await getS3Client(sample);
      // Set the upload percentage for the sample to 0
      updateSampleUploadPercentage(sample.name, 0);

      if (!sample.input_files) return;
      await Promise.all(
        sample.input_files.map(async inputFile => {
          // Upload the input file to s3
          // Also updates the upload percentage for the sample
          await uploadInputFileToS3(sample, inputFile, s3ClientForSample);
        }),
      );

      // Update the sample upload status (success or error)
      await completeSampleUpload({
        sample,
        onSampleUploadSuccess: (sample: SampleForUpload) => {
          updateSampleUploadStatus(sample.name, "success");
        },
        onMarkSampleUploadedError: handleSampleUploadError,
      });
    } catch (e) {
      handleSampleUploadError(sample, e);
      heartbeatInterval && clearInterval(heartbeatInterval);
    }
  };

  const getS3Client = async (sample: SampleForUpload) => {
    const credentials = await getUploadCredentials(sample.id);
    const {
      access_key_id: accessKeyId,
      aws_region: region,
      expiration,
      secret_access_key: secretAccessKey,
      session_token: sessionToken,
    } = credentials;

    return new S3Client({
      region,
      credentials: {
        accessKeyId,
        secretAccessKey,
        sessionToken,
        expiration,
      },
      useAccelerateEndpoint: true,
    });
  };

  const uploadInputFileToS3 = async (
    sample: SampleForUpload,
    inputFile: PathToFile,
    s3Client: S3Client,
  ) => {
    const {
      name: fileName,
      s3_bucket: s3Bucket,
      s3_file_path: s3Key,
    } = inputFile;

    if (sampleFileCompleted[s3Key]) {
      return;
    }

    const body = sample.filesToUpload[fileName];
    const uploadParams = {
      Bucket: s3Bucket,
      Key: s3Key,
      Body: body,
      ChecksumAlgorithm: ChecksumAlgorithm.SHA256,
    };

    updateSampleFilePercentage({
      sampleName: sample.name,
      s3Key,
      fileSize: body.size,
    });

    const fileUpload = new Upload({
      client: s3Client,
      leavePartsOnError: true, // configures lib to propagate errors
      params: uploadParams,
      ...(sampleFileUploadIds[s3Key] && {
        uploadId: sampleFileUploadIds[s3Key],
      }),
    });

    const removeS3KeyFromUploadIds = (s3Key: string) => {
      setSampleFileUploadIds(prevState => omit(s3Key, prevState));
    };

    fileUpload.on("httpUploadProgress", progress => {
      const percentage =
        progress.loaded && progress.total
          ? progress.loaded / progress.total
          : 0;
      updateSampleFilePercentage({
        sampleName: sample.name,
        s3Key,
        percentage,
      });
    });

    fileUpload.onCreatedMultipartUpload(uploadId => {
      setSampleFileUploadIds(prevState => {
        return uploadId
          ? { ...prevState, [s3Key]: uploadId }
          : // when there is no valid upload ID we could not create a multipart upload
            // for the file, so remove it from upload ID list to avoid retrying it
            removeS3KeyFromUploadIds(s3Key);
      });
    });

    await fileUpload.done();

    // prevent successfully uploaded files from being resumed if other files fail
    removeS3KeyFromUploadIds(s3Key);

    setSampleFileCompleted(prevState => ({
      ...prevState,
      [s3Key]: true,
    }));
  };

  const updateSampleUploadStatus = (sampleName: string, status: string) => {
    setSampleUploadStatuses(prevState => ({
      ...prevState,
      [sampleName]: status,
    }));
  };

  const updateSampleFilePercentage = ({
    sampleName,
    s3Key,
    percentage = 0,
    fileSize = null,
  }: {
    sampleName: string;
    percentage?: number;
    s3Key: string;
    fileSize?: number | null;
  }) => {
    const newSampleKeyState: { percentage: number; size?: number } = {
      percentage,
    };
    if (fileSize) {
      newSampleKeyState.size = fileSize;
    }

    const newSampleFileState = {
      ...sampleFilePercentages[sampleName],
      [s3Key]: {
        ...(sampleFilePercentages[sampleName] &&
          sampleFilePercentages[sampleName][s3Key]),
        ...newSampleKeyState,
      },
    };

    sampleFilePercentages = {
      ...sampleFilePercentages,
      [sampleName]: newSampleFileState,
    };

    updateSampleUploadPercentage(
      sampleName,
      calculatePercentageForSample(sampleFilePercentages[sampleName]),
    );
  };

  const updateSampleUploadPercentage = (
    sampleName: string,
    percentage: number,
  ) => {
    setSampleUploadPercentages(prevState => ({
      ...prevState,
      [sampleName]: percentage,
    }));
  };

  const calculatePercentageForSample = (sampleFilePercentage: {
    [key: string]: { percentage: number; size: number };
  }) => {
    const uploadedSize = sum(
      map(key => (key.percentage || 0) * key.size, sampleFilePercentage),
    );

    const totalSize = sum(map(progress => progress.size, sampleFilePercentage));

    return uploadedSize / totalSize;
  };

  const handleSampleUploadError = (sample: SampleForUpload, error = null) => {
    const message =
      "UploadProgressModal: Local sample upload error to S3 occured";

    updateSampleUploadStatus(sample.name, ERROR_STATUS);

    logError({
      message,
      details: {
        sample,
        error,
      },
    });
  };

  const getLocalSamplesInProgress = () => {
    return filter(
      sample =>
        sampleUploadStatuses[sample.name] === undefined ||
        sampleUploadStatuses[sample.name] === IN_PROGRESS_STATUS,
      samples,
    );
  };

  const getLocalSamplesFailed = () => {
    return filter(
      sample => sampleUploadStatuses[sample.name] === ERROR_STATUS,
      samples,
    );
  };

  const retryFailedSampleUploads = async (failedSamples: SampleFromApi[]) => {
    setRetryingSampleUpload(true);
    setUploadComplete(false);
    failedSamples.forEach(failedSample =>
      updateSampleUploadStatus(failedSample.name, IN_PROGRESS_STATUS),
    );
    if (locallyCreatedSamples.length > 0) {
      const failedLocallyCreatedSamples = failedSamples
        .map(failedSample => {
          return locallyCreatedSamples.find(
            locallyCreatedSample =>
              locallyCreatedSample.name === failedSample.name,
          );
        })
        .filter(
          (locallyCreatedSample): locallyCreatedSample is SampleForUpload =>
            locallyCreatedSample !== undefined,
        );

      await uploadSamples(failedLocallyCreatedSamples);
    } else {
      initiateLocalUpload();
    }
  };

  const completeLocalUpload = () => {
    onUploadComplete();
    setUploadComplete(true);
    setRetryingSampleUpload(false);
  };

  const hasFailedSamples = !isEmpty(getLocalSamplesFailed());
  const numberOfFailedSamples = size(getLocalSamplesFailed());

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
      <LocalUploadModalHeader
        hasFailedSamples={hasFailedSamples}
        numberOfFailedSamples={numberOfFailedSamples}
        localSamplesFailed={getLocalSamplesFailed()}
        numLocalSamplesInProgress={size(getLocalSamplesInProgress())}
        retryFailedSampleUploads={retryFailedSampleUploads}
        retryingSampleUpload={retryingSampleUpload}
        sampleUploadStatuses={sampleUploadStatuses}
        numberOfSamples={size(samples)}
        projectName={project.name}
      />
      <UploadProgressModalSampleList
        samples={samples}
        sampleUploadPercentages={sampleUploadPercentages}
        sampleUploadStatuses={sampleUploadStatuses}
        onRetryUpload={retryFailedSampleUploads}
      />
      {!retryingSampleUpload && uploadComplete && (
        <div className={cs.footer}>
          <PrimaryButton
            text="Go to Project"
            onClick={() => {
              hasFailedSamples
                ? setConfirmationModalOpen(true)
                : redirectToProject(project.id);
            }}
          />
        </div>
      )}
      {confirmationModalOpen && (
        <UploadConfirmationModal
          numberOfFailedSamples={numberOfFailedSamples}
          onCancel={() => {
            setConfirmationModalOpen(false);
          }}
          onConfirm={() => {
            redirectToProject(project.id);
          }}
          open
        />
      )}
    </Modal>
  );
};
