import { flow, keyBy, mapValues, omit } from "lodash/fp";
import React from "react";
import { TaxonOption } from "~/components/common/filters/types";
import { MetadataBasic, Project, SampleFromApi } from "~/interface/shared";
import { UploadWorkflows } from "../../constants";
import { RefSeqAccessionDataType } from "../UploadSampleStep/types";
import { LocalUploadProgressModal } from "./components/LocalUploadProgressModal";
import { RemoteUploadProgressModal } from "./components/RemoteUploadProgressModal";

interface UploadProgressModalProps {
  adminOptions: Record<string, string>;
  bedFile: File | null;
  clearlabs: boolean;
  guppyBasecallerSetting: string;
  medakaModel: string | null;
  metadata: MetadataBasic | null;
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

export const UploadProgressModal = ({
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
          metadata={metadata && processMetadataRows(metadata.rows)}
          onUploadComplete={onUploadComplete}
          project={project}
          refSeqAccession={refSeqAccession}
          refSeqFile={refSeqFile}
          refSeqTaxon={refSeqTaxon}
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
          // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2532
          metadata={processMetadataRows(metadata.rows)}
          onUploadComplete={onUploadComplete}
          project={project}
          refSeqAccession={refSeqAccession}
          refSeqFile={refSeqFile}
          refSeqTaxon={refSeqTaxon}
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
