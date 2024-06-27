import React from "react";
import { TaxonOption } from "~/components/common/filters/types";
import ExternalLink from "~/components/ui/controls/ExternalLink";
import { AMR_PIPELINE_GITHUB_LINK } from "~/components/utils/documentationLinks";
import { WorkflowType } from "~/components/utils/workflows";
import { PipelineVersions, SampleUploadType } from "~/interface/shared";
import { IconCovidVirusXLarge } from "~ui/icons";
import {
  BASESPACE_UPLOAD,
  LOCAL_UPLOAD,
  NANOPORE,
  NO_TECHNOLOGY_SELECTED,
  REMOTE_UPLOAD,
  SEQUENCING_TECHNOLOGY_OPTIONS,
  Technology,
  UploadWorkflows,
  UPLOAD_WORKFLOWS,
} from "../../constants";
import { AnalysisType } from "./components/AnalysisType";
import { ConsensusGenomeSequencingPlatformOptions } from "./components/ConsensusGenomeSequencingPlatformOptions";
import { MetagenomicsSequencingPlatformOptions } from "./components/MetagenomicsSequencingPlatformOptions";
import { PipelineVersionIndicator } from "./components/PipelineVersionIndicator";
import { ViralConsensusGenomeSequencingPlatformOptions } from "./components/ViralConsensusGenomeSequencingPlatformOptions";
import { WorkflowLinksConfig } from "./workflowTypeConfig";
import cs from "./workflow_selector.scss";

interface WorkflowSelectorProps {
  bedFileName: string;
  refSeqFileName: string;
  hasRefSeqFileNameError: boolean;
  enabledWorkflows: UploadWorkflows[];
  onBedFileChanged(file?: File): void;
  onClearLabsChange?: (usedClearLabs: boolean) => void;
  onMedakaModelChange?: (selected: string) => void;
  onRefSeqFileChanged(file?: File): void;
  onTaxonChange(taxon: TaxonOption): void;
  onTechnologyToggle?: (
    workflow: UploadWorkflows,
    technology: SEQUENCING_TECHNOLOGY_OPTIONS,
  ) => void;
  onGuppyBasecallerSettingChange?: (selected: string) => void;
  onWetlabProtocolChange?: (selected: string) => void;
  onWorkflowToggle?: (
    workflow: UploadWorkflows,
    technology?: SEQUENCING_TECHNOLOGY_OPTIONS,
  ) => void;
  currentTab?: SampleUploadType;
  projectPipelineVersions: PipelineVersions;
  latestMajorPipelineVersions: PipelineVersions;
  selectedMedakaModel?: string;
  selectedGuppyBasecallerSetting?: string;
  selectedTaxon: TaxonOption;
  selectedTechnology:
    | SEQUENCING_TECHNOLOGY_OPTIONS
    | typeof NO_TECHNOLOGY_SELECTED;
  selectedWetlabProtocol?: string;
  selectedWorkflows?: Set<UploadWorkflows>;
  s3UploadEnabled?: boolean;
  usedClearLabs?: boolean;
}

export const shouldDisableSequencingPlatformOption = (
  currentTab: SampleUploadType,
  technology: Technology,
  workflow: UploadWorkflows,
) => {
  switch (currentTab) {
    case REMOTE_UPLOAD:
      return (
        technology === NANOPORE && workflow === UPLOAD_WORKFLOWS.MNGS.value
      );
    case BASESPACE_UPLOAD:
      return technology === NANOPORE;
    case LOCAL_UPLOAD:
      return false;
  }
};

const WorkflowSelector = ({
  bedFileName,
  refSeqFileName,
  hasRefSeqFileNameError,
  enabledWorkflows,
  onBedFileChanged,
  onClearLabsChange,
  onMedakaModelChange,
  onRefSeqFileChanged,
  onTaxonChange,
  onTechnologyToggle,
  onGuppyBasecallerSettingChange,
  onWetlabProtocolChange,
  onWorkflowToggle,
  currentTab,
  projectPipelineVersions,
  latestMajorPipelineVersions,
  selectedMedakaModel,
  selectedGuppyBasecallerSetting,
  selectedTaxon,
  selectedTechnology,
  selectedWetlabProtocol,
  selectedWorkflows,
  s3UploadEnabled,
  usedClearLabs,
}: WorkflowSelectorProps) => {
  const shouldDisableWorkflow = (workflow: UploadWorkflows) => {
    return !enabledWorkflows.includes(workflow);
  };

  return (
    <div className={cs.workflowSelector}>
      <div className={cs.header}>Analysis Type</div>
      <AnalysisType
        description={
          "Run your samples through our metagenomics pipeline. Our pipeline supports Illumina and Nanopore technologies."
        }
        isDisabled={shouldDisableWorkflow(UPLOAD_WORKFLOWS.MNGS.value)}
        // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2722
        onClick={() => onWorkflowToggle(UPLOAD_WORKFLOWS.MNGS.value)}
        // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2532
        isSelected={selectedWorkflows.has(UPLOAD_WORKFLOWS.MNGS.value)}
        sequencingPlatformOptions={
          <MetagenomicsSequencingPlatformOptions
            // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2322
            currentTab={currentTab}
            latestMajorPipelineVersions={latestMajorPipelineVersions}
            // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2322
            onChangeGuppyBasecallerSetting={onGuppyBasecallerSettingChange}
            // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2322
            onTechnologyToggle={onTechnologyToggle}
            // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2322
            onWetlabProtocolChange={onWetlabProtocolChange}
            projectPipelineVersions={projectPipelineVersions}
            // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2322
            selectedGuppyBasecallerSetting={selectedGuppyBasecallerSetting}
            selectedTechnology={selectedTechnology}
            // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2322
            selectedWetlabProtocol={selectedWetlabProtocol}
          />
        }
        sdsIcon={UPLOAD_WORKFLOWS.MNGS.icon}
        testKey={UPLOAD_WORKFLOWS.MNGS.value}
        title={UPLOAD_WORKFLOWS.MNGS.label}
      />
      <AnalysisType
        description={
          <>
            Run your samples through our antimicrobial resistance pipeline. Our
            pipeline supports metagenomics or whole genome data. It only
            supports Illumina. You can also run the AMR pipeline from within an
            existing project by selecting previously uploaded mNGS samples. You
            can check out the AMR pipeline on Github{" "}
            {shouldDisableWorkflow(UPLOAD_WORKFLOWS.AMR.value) ? (
              "here."
            ) : (
              <>
                <ExternalLink href={AMR_PIPELINE_GITHUB_LINK}>
                  here
                </ExternalLink>
                .
              </>
            )}
          </>
        }
        isDisabled={shouldDisableWorkflow(UPLOAD_WORKFLOWS.AMR.value)}
        // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2722
        onClick={() => onWorkflowToggle(UPLOAD_WORKFLOWS.AMR.value)}
        // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2532
        isSelected={selectedWorkflows.has(UPLOAD_WORKFLOWS.AMR.value)}
        sdsIcon={UPLOAD_WORKFLOWS.AMR.icon}
        testKey={UPLOAD_WORKFLOWS.AMR.value}
        title={UPLOAD_WORKFLOWS.AMR.label}
        sequencingPlatformOptions={
          <div className={cs.technologyContent}>
            <PipelineVersionIndicator
              isPipelineVersion={true}
              isNewVersionAvailable={
                projectPipelineVersions?.[WorkflowType.AMR]?.[0] !==
                latestMajorPipelineVersions?.[WorkflowType.AMR]
              }
              warningHelpLink={
                WorkflowLinksConfig[WorkflowType.AMR].warningLink
              }
              version={projectPipelineVersions?.[WorkflowType.AMR]}
              versionHelpLink={
                WorkflowLinksConfig[WorkflowType.AMR].pipelineVersionLink
              }
            />
          </div>
        }
      />
      <AnalysisType
        description="Run your samples through our Illumina supported pipeline to get viral consensus genomes using your own reference sequence. Pipeline report does not link to Nextclade."
        isDisabled={shouldDisableWorkflow(
          UPLOAD_WORKFLOWS.VIRAL_CONSENSUS_GENOME.value,
        )}
        onClick={() =>
          // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2722
          onWorkflowToggle(
            UPLOAD_WORKFLOWS.VIRAL_CONSENSUS_GENOME.value,
            SEQUENCING_TECHNOLOGY_OPTIONS.ILLUMINA,
          )
        }
        // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2532
        isSelected={selectedWorkflows.has(
          UPLOAD_WORKFLOWS.VIRAL_CONSENSUS_GENOME.value,
        )}
        sdsIcon={UPLOAD_WORKFLOWS.VIRAL_CONSENSUS_GENOME.icon}
        testKey={UPLOAD_WORKFLOWS.VIRAL_CONSENSUS_GENOME.value}
        title={UPLOAD_WORKFLOWS.VIRAL_CONSENSUS_GENOME.label}
        sequencingPlatformOptions={
          <ViralConsensusGenomeSequencingPlatformOptions
            bedFileName={bedFileName}
            refSeqFileName={refSeqFileName}
            hasRefSeqFileNameError={hasRefSeqFileNameError}
            selectedTaxon={selectedTaxon}
            onBedFileChanged={onBedFileChanged}
            onRefSeqFileChanged={onRefSeqFileChanged}
            onTaxonChange={onTaxonChange}
            pipelineVersion={
              projectPipelineVersions?.[WorkflowType.CONSENSUS_GENOME]
            }
            latestMajorVersion={
              latestMajorPipelineVersions?.[WorkflowType.CONSENSUS_GENOME]
            }
          />
        }
      />
      <AnalysisType
        description="Run your samples through our Illumina or Nanopore supported pipelines to get consensus genomes for SARS-CoV-2. Send consensus genomes to Nextclade."
        isDisabled={shouldDisableWorkflow(
          UPLOAD_WORKFLOWS.COVID_CONSENSUS_GENOME.value,
        )}
        onClick={() =>
          // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2722
          onWorkflowToggle(UPLOAD_WORKFLOWS.COVID_CONSENSUS_GENOME.value)
        }
        // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2532
        isSelected={selectedWorkflows.has(
          UPLOAD_WORKFLOWS.COVID_CONSENSUS_GENOME.value,
        )}
        sequencingPlatformOptions={
          <ConsensusGenomeSequencingPlatformOptions
            // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2322
            currentTab={currentTab}
            // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2322
            isS3UploadEnabled={s3UploadEnabled}
            onClearLabsChange={onClearLabsChange}
            onMedakaModelChange={onMedakaModelChange}
            // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2322
            selectedMedakaModel={selectedMedakaModel}
            // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2322
            usedClearLabs={usedClearLabs}
            // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2322
            selectedWetlabProtocol={selectedWetlabProtocol}
            // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2322
            onWetlabProtocolChange={onWetlabProtocolChange}
            selectedTechnology={selectedTechnology}
            // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2322
            onTechnologyToggle={onTechnologyToggle}
            projectPipelineVersions={projectPipelineVersions}
            latestMajorPipelineVersions={latestMajorPipelineVersions}
          />
        }
        customIcon={
          <IconCovidVirusXLarge
            className={
              shouldDisableWorkflow(
                UPLOAD_WORKFLOWS.COVID_CONSENSUS_GENOME.value,
              ) && cs.disabledSvgIcon
            }
          />
        }
        testKey={UPLOAD_WORKFLOWS.COVID_CONSENSUS_GENOME.value}
        title={UPLOAD_WORKFLOWS.COVID_CONSENSUS_GENOME.label}
      />
    </div>
  );
};

export { WorkflowSelector };
