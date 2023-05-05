import { flow, keyBy, mapValues, omit } from "lodash/fp";
import React from "react";
import { MetadataBasic, Project, SampleFromApi } from "~/interface/shared";
import LocalUploadProgressModal from "./LocalUploadProgressModal";
import RemoteUploadProgressModal from "./RemoteUploadProgressModal";

interface UploadProgressModalProps {
  adminOptions: Record<string, string>;
  bedFile?: File;
  clearlabs?: boolean;
  guppyBasecallerSetting: string;
  medakaModel?: string;
  metadata?: MetadataBasic;
  onUploadComplete: $TSFixMeFunction;
  project?: Project;
  refSeqFile?: File;
  samples?: SampleFromApi[];
  skipSampleProcessing?: boolean;
  technology?: string;
  uploadType: string;
  useStepFunctionPipeline?: boolean;
  wetlabProtocol?: string;
  workflows?: Set<string>;
}

const UploadProgressModal = ({
  adminOptions,
  bedFile,
  clearlabs,
  guppyBasecallerSetting,
  medakaModel,
  metadata,
  onUploadComplete,
  project,
  refSeqFile,
  samples,
  skipSampleProcessing,
  technology,
  uploadType,
  useStepFunctionPipeline,
  wetlabProtocol,
  workflows,
}: UploadProgressModalProps) => {
  const processMetadataRows = (metadataRows: MetadataBasic["rows"]) =>
    flow(
      // @ts-expect-error Property 'sample_name' does not exist on type 'unknown'.
      keyBy(row => row.sample_name || row["Sample Name"]),
      mapValues(omit(["sample_name", "Sample Name"])),
    )(metadataRows);

  return (
    <>
      {uploadType === "local" ? (
        <LocalUploadProgressModal
          adminOptions={adminOptions}
          bedFile={bedFile}
          clearlabs={clearlabs}
          guppyBasecallerSetting={guppyBasecallerSetting}
          technology={technology}
          medakaModel={medakaModel}
          metadata={processMetadataRows(metadata.rows)}
          onUploadComplete={onUploadComplete}
          project={project}
          refSeqFile={refSeqFile}
          samples={samples}
          skipSampleProcessing={skipSampleProcessing}
          uploadType={uploadType}
          useStepFunctionPipeline={useStepFunctionPipeline}
          wetlabProtocol={wetlabProtocol}
          workflows={workflows}
        />
      ) : (
        <RemoteUploadProgressModal
          adminOptions={adminOptions}
          bedFile={bedFile}
          clearlabs={clearlabs}
          technology={technology}
          medakaModel={medakaModel}
          metadata={processMetadataRows(metadata.rows)}
          onUploadComplete={onUploadComplete}
          project={project}
          refSeqFile={refSeqFile}
          samples={samples}
          skipSampleProcessing={skipSampleProcessing}
          uploadType={uploadType}
          useStepFunctionPipeline={useStepFunctionPipeline}
          wetlabProtocol={wetlabProtocol}
          workflows={workflows}
        />
      )}
    </>
  );
};

export default UploadProgressModal;
