import { flow, keyBy, mapValues, omit } from "lodash/fp";
import React from "react";
import { Project, SampleFromApi, MetadataBasic } from "~/interface/shared";
import LocalUploadProgressModal from "./LocalUploadProgressModal";
import RemoteUploadProgressModal from "./RemoteUploadProgressModal";

interface UploadProgressModalProps {
  samples?: SampleFromApi[];
  adminOptions: Record<string, string>;
  clearlabs?: boolean;
  medakaModel?: string;
  metadata?: MetadataBasic;
  onUploadComplete: $TSFixMeFunction;
  project?: Project;
  skipSampleProcessing?: boolean;
  technology?: string;
  uploadType: string;
  useStepFunctionPipeline?: boolean;
  wetlabProtocol?: string;
  workflows?: Set<string>;
  guppyBasecallerSetting: string;
}

const UploadProgressModal = ({
  adminOptions,
  clearlabs,
  guppyBasecallerSetting,
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
          clearlabs={clearlabs}
          guppyBasecallerSetting={guppyBasecallerSetting}
          technology={technology}
          medakaModel={medakaModel}
          metadata={processMetadataRows(metadata.rows)}
          onUploadComplete={onUploadComplete}
          project={project}
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
          clearlabs={clearlabs}
          technology={technology}
          medakaModel={medakaModel}
          metadata={processMetadataRows(metadata.rows)}
          onUploadComplete={onUploadComplete}
          project={project}
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
