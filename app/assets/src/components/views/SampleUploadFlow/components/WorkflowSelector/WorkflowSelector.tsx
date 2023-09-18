import { size } from "lodash/fp";
import React, { useContext } from "react";
import { TaxonOption } from "~/components/common/filters/types";
import { UserContext } from "~/components/common/UserContext";
import ExternalLink from "~/components/ui/controls/ExternalLink";
import {
  AMR_PINNED_PIPELINE_VERSION_HELP_LINK,
  AMR_PIPELINE_GITHUB_LINK,
} from "~/components/utils/documentationLinks";
import {
  ONT_V1_FEATURE,
  WGS_CG_UPLOAD_FEATURE,
} from "~/components/utils/features";
import {
  AMR_MODERN_HOST_FILTERING_FEATURE,
  isPipelineFeatureAvailable,
} from "~/components/utils/pipeline_versions";
import { WorkflowType } from "~/components/utils/workflows";
import { ProjectPipelineVersions, SampleUploadType } from "~/interface/shared";
import { IconCovidVirusXLarge } from "~ui/icons";
import {
  BASESPACE_UPLOAD,
  LOCAL_UPLOAD,
  NANOPORE,
  PIPELINE_HELP_LINKS,
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
import cs from "./workflow_selector.scss";

interface WorkflowSelectorProps {
  bedFileName: string;
  refSeqFileName: string;
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
  projectPipelineVersions: ProjectPipelineVersions;
  selectedMedakaModel?: string;
  selectedGuppyBasecallerSetting?: string;
  selectedTaxon: TaxonOption;
  selectedTechnology?: SEQUENCING_TECHNOLOGY_OPTIONS;
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
  selectedMedakaModel,
  selectedGuppyBasecallerSetting,
  selectedTaxon,
  selectedTechnology,
  selectedWetlabProtocol,
  selectedWorkflows,
  s3UploadEnabled,
  usedClearLabs,
}: WorkflowSelectorProps) => {
  const userContext = useContext(UserContext);
  const { allowedFeatures } = userContext || {};

  // TODO (mlila): delete this when we remove WGS_CG_UPLOAD_FEATURE
  const shouldDisableWorkflowOption = (workflow: UploadWorkflows) => {
    const workflowIsCurrentlySelected = selectedWorkflows.has(workflow);
    const selectedMNGSNanopore =
      selectedWorkflows.has(UPLOAD_WORKFLOWS.MNGS.value) &&
      selectedTechnology === SEQUENCING_TECHNOLOGY_OPTIONS.NANOPORE;

    switch (workflow) {
      case UPLOAD_WORKFLOWS.MNGS.value:
        return (
          !workflowIsCurrentlySelected &&
          selectedWorkflows.has(UPLOAD_WORKFLOWS.COVID_CONSENSUS_GENOME.value)
        );
      case UPLOAD_WORKFLOWS.AMR.value:
        return (
          !workflowIsCurrentlySelected &&
          (selectedWorkflows.has(
            UPLOAD_WORKFLOWS.COVID_CONSENSUS_GENOME.value,
          ) ||
            selectedMNGSNanopore)
        );
      case UPLOAD_WORKFLOWS.COVID_CONSENSUS_GENOME.value:
        return !workflowIsCurrentlySelected && size(selectedWorkflows) > 0;
    }
  };

  const shouldDisableWorkflow = (workflow: UploadWorkflows) => {
    return allowedFeatures.includes(WGS_CG_UPLOAD_FEATURE)
      ? !enabledWorkflows.includes(workflow)
      : shouldDisableWorkflowOption(workflow);
  };

  const isPinnedVersion =
    projectPipelineVersions?.[WorkflowType.AMR] &&
    !isPipelineFeatureAvailable(
      AMR_MODERN_HOST_FILTERING_FEATURE,
      projectPipelineVersions?.[WorkflowType.AMR],
    );

  return (
    <div className={cs.workflowSelector}>
      <div className={cs.header}>Analysis Type</div>
      <AnalysisType
        description={
          allowedFeatures.includes(ONT_V1_FEATURE)
            ? "Run your samples through our metagenomics pipeline. Our pipeline supports Illumina and Nanopore technologies."
            : "Run your samples through our metagenomics pipeline. Our pipeline only supports Illumina."
        }
        isDisabled={shouldDisableWorkflow(UPLOAD_WORKFLOWS.MNGS.value)}
        onClick={() => onWorkflowToggle(UPLOAD_WORKFLOWS.MNGS.value)}
        isSelected={selectedWorkflows.has(UPLOAD_WORKFLOWS.MNGS.value)}
        sequencingPlatformOptions={
          <MetagenomicsSequencingPlatformOptions
            currentTab={currentTab}
            onChangeGuppyBasecallerSetting={onGuppyBasecallerSettingChange}
            onTechnologyToggle={onTechnologyToggle}
            onWetlabProtocolChange={onWetlabProtocolChange}
            projectPipelineVersions={projectPipelineVersions}
            selectedGuppyBasecallerSetting={selectedGuppyBasecallerSetting}
            selectedTechnology={selectedTechnology}
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
        onClick={() => onWorkflowToggle(UPLOAD_WORKFLOWS.AMR.value)}
        isSelected={selectedWorkflows.has(UPLOAD_WORKFLOWS.AMR.value)}
        sdsIcon={UPLOAD_WORKFLOWS.AMR.icon}
        testKey={UPLOAD_WORKFLOWS.AMR.value}
        title={UPLOAD_WORKFLOWS.AMR.label}
        sequencingPlatformOptions={
          <div className={cs.technologyContent}>
            <PipelineVersionIndicator
              isPinnedVersion={isPinnedVersion}
              pipelineHelpLink={PIPELINE_HELP_LINKS[WorkflowType.AMR]}
              version={projectPipelineVersions?.[WorkflowType.AMR]}
              versionHelpLink={AMR_PINNED_PIPELINE_VERSION_HELP_LINK}
            />
          </div>
        }
      />
      {allowedFeatures.includes(WGS_CG_UPLOAD_FEATURE) && (
        <AnalysisType
          description="Run your samples through our Illumina supported pipeline to get viral consensus genomes using your own reference sequence. Pipeline report does not link to Nextclade."
          isDisabled={shouldDisableWorkflow(
            UPLOAD_WORKFLOWS.VIRAL_CONSENSUS_GENOME.value,
          )}
          onClick={() =>
            onWorkflowToggle(
              UPLOAD_WORKFLOWS.VIRAL_CONSENSUS_GENOME.value,
              SEQUENCING_TECHNOLOGY_OPTIONS.ILLUMINA,
            )
          }
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
              selectedTaxon={selectedTaxon}
              onBedFileChanged={onBedFileChanged}
              onRefSeqFileChanged={onRefSeqFileChanged}
              onTaxonChange={onTaxonChange}
            />
          }
        />
      )}
      <AnalysisType
        description="Run your samples through our Illumina or Nanopore supported pipelines to get consensus genomes for SARS-CoV-2. Send consensus genomes to Nextclade."
        isDisabled={shouldDisableWorkflow(
          UPLOAD_WORKFLOWS.COVID_CONSENSUS_GENOME.value,
        )}
        onClick={() =>
          onWorkflowToggle(UPLOAD_WORKFLOWS.COVID_CONSENSUS_GENOME.value)
        }
        isSelected={selectedWorkflows.has(
          UPLOAD_WORKFLOWS.COVID_CONSENSUS_GENOME.value,
        )}
        sequencingPlatformOptions={
          <ConsensusGenomeSequencingPlatformOptions
            currentTab={currentTab}
            isS3UploadEnabled={s3UploadEnabled}
            onClearLabsChange={onClearLabsChange}
            onMedakaModelChange={onMedakaModelChange}
            selectedMedakaModel={selectedMedakaModel}
            usedClearLabs={usedClearLabs}
            selectedWetlabProtocol={selectedWetlabProtocol}
            onWetlabProtocolChange={onWetlabProtocolChange}
            selectedTechnology={selectedTechnology}
            onTechnologyToggle={onTechnologyToggle}
            projectPipelineVersions={projectPipelineVersions}
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
