import { ChecksumAlgorithm, S3Client } from "@aws-sdk/client-s3";
import { Upload } from "@aws-sdk/lib-storage";
import cx from "classnames";
import { find, get, map, pick, take } from "lodash/fp";
import React, { useCallback, useEffect, useState } from "react";
import {
  bulkUploadBasespace,
  bulkUploadRemote,
  getUploadCredentials,
} from "~/api/upload";
import { TaxonOption } from "~/components/common/filters/types";
import PrimaryButton from "~/components/ui/controls/buttons/PrimaryButton";
import { logError } from "~/components/utils/logUtil";
import { MetadataBasic, Project, SampleFromApi } from "~/interface/shared";
import Modal from "~ui/containers/Modal";
import { UploadWorkflows } from "../../../../constants";
import { RefSeqAccessionDataType } from "../../../UploadSampleStep/types";
import cs from "../../upload_progress_modal.scss";
import {
  addAdditionalInputFilesToSamples,
  addFlagsToSamples,
  redirectToProject,
} from "../../upload_progress_utils";
import { RemoteUploadModalHeader } from "./components/RemoteUploadModalHeader";

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
  bedFile: File | null;
  clearlabs: boolean;
  medakaModel: string | null;
  metadata?: MetadataBasic;
  onUploadComplete: $TSFixMeFunction;
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

export const RemoteUploadProgressModal = ({
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

  const uploadSamples = useCallback(async (samples: $TSFixMe) => {
    // Note that unlike LocalUploadProgressModal, we don't track the progress of the uploads.
    await Promise.all(
      samples.map(async (sample: $TSFixMe) => {
        try {
          // Get the credentials for the sample
          const s3ClientForSample = await getS3Client(sample);

          await Promise.all(
            sample.input_files.map(async (inputFile: $TSFixMe) => {
              // Upload the additional input files to s3
              // The sample FASTQS from Basespace or S3 will be uploaded by the backend.
              if (Object.keys(sample.filesToUpload).includes(inputFile.name)) {
                await uploadInputFileToS3(sample, inputFile, s3ClientForSample);
              }
            }),
          );
        } catch (e) {
          logError({
            message:
              "UploadProgressModal: Upload error to s3 occurred for additional input file of remote sample",
            details: {
              sample,
              e,
            },
          });
        }
      }),
    );
  }, []);

  const initiateRemoteUpload = useCallback(async () => {
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

    const includeAdditionalInputFiles = bedFile || refSeqFile;
    if (includeAdditionalInputFiles) {
      addAdditionalInputFilesToSamples({
        samples: samplesWithFlags,
        bedFile,
        refSeqFile,
      });
    }

    // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2345
    setSamplesToUpload(samplesWithFlags);

    let response: {
      errored_sample_names: $TSFixMeUnknown[];
      errors: $TSFixMeUnknown[];
      sample_ids: $TSFixMeUnknown[];
      samples: $TSFixMeUnknown[];
    };
    try {
      response = await bulkUploadFn({
        samples: samplesWithFlags,
        metadata,
      });
      if (includeAdditionalInputFiles) {
        // The samples created from the network response (response.samples) contain information about the sample itself (metadata),
        // but do not contain the files that need to be upload to S3.
        // We need to fetch the files from samplesWithFlags and copy them over to response.samples
        response.samples.forEach(
          (createdSample: $TSFixMe) =>
            (createdSample["filesToUpload"] = get(
              "files",
              find({ name: createdSample.name }, samplesWithFlags),
            )),
        );
        await uploadSamples(response.samples);
      }
    } catch (error) {
      logError({
        message: `UploadProgressModal: ${bulkUploadFnName} error`,
        details: { error },
      });

      setUploadComplete(true);
      // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2345
      setFailedSampleNames(map("name", samples));
      return;
    }

    setUploadComplete(true);
    // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2345
    setFailedSampleNames(response.errored_sample_names || []);

    onUploadComplete();
  }, [
    adminOptions,
    bedFile,
    clearlabs,
    medakaModel,
    metadata,
    onUploadComplete,
    refSeqAccession,
    refSeqFile,
    refSeqTaxon,
    samples,
    skipSampleProcessing,
    technology,
    uploadSamples,
    uploadType,
    useStepFunctionPipeline,
    wetlabProtocol,
    workflows,
  ]);

  useEffect(() => {
    initiateRemoteUpload();
  }, [initiateRemoteUpload]);

  const getS3Client = async (sample: $TSFixMe) => {
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
    sample: $TSFixMe,
    inputFile: $TSFixMe,
    s3Client: $TSFixMe,
  ) => {
    const {
      name: fileName,
      s3_bucket: s3Bucket,
      s3_file_path: s3Key,
    } = inputFile;

    const body = sample.filesToUpload[fileName];
    const uploadParams = {
      Bucket: s3Bucket,
      Key: s3Key,
      Body: body,
      ChecksumAlgorithm: ChecksumAlgorithm.SHA256,
    };

    const fileUpload = new Upload({
      client: s3Client,
      params: uploadParams,
    });

    await fileUpload.done();
  };

  const renderViewProjectButton = () => {
    if (project) {
      const buttonCallback = () => redirectToProject(project.id);
      return <PrimaryButton text="Go to Project" onClick={buttonCallback} />;
    }
    return null;
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
        <RemoteUploadModalHeader
          isUploadComplete={uploadComplete}
          nFailedSamples={failedSampleNames.length}
          nSamples={samplesToUpload.length}
          projectName={project.name}
          uploadType={uploadType}
        />
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
