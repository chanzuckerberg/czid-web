import { size } from "lodash/fp";
import React, { useContext } from "react";

import { UserContext } from "~/components/common/UserContext";
import { AMR_V1_FEATURE, ONT_V1_FEATURE } from "~/components/utils/features";
import { WORKFLOWS } from "~/components/utils/workflows";
import { ProjectPipelineVersions, SampleUploadType } from "~/interface/shared";

import {
  UPLOAD_WORKFLOWS,
  SEQUENCING_TECHNOLOGY_OPTIONS,
  LOCAL_UPLOAD,
  REMOTE_UPLOAD,
  BASESPACE_UPLOAD,
  NANOPORE,
  Technology,
  UploadWorkflows,
} from "../../constants";
import { AnalysisType } from "./components/AnalysisType";
import { ConsensusGenomeSequencingPlatformOptions } from "./components/ConsensusGenomeSequencingPlatformOptions";
import { MetagenomicsSequencingPlatformOptions } from "./components/MetagenomicsSequencingPlatformOptions";
import { PipelineVersionIndicator } from "./components/PipelineVersionIndicator";
import cs from "./workflow_selector.scss";

interface WorkflowSelectorProps {
  onClearLabsChange?: (usedClearLabs: boolean) => void;
  onMedakaModelChange?: (selected: string) => void;
  onTechnologyToggle?: (technology: string) => void;
  onGuppyBasecallerSettingChange?: (selected: string) => void;
  onWetlabProtocolChange?: (selected: string) => void;
  onWorkflowToggle?: (workflow: string) => void;
  currentTab?: SampleUploadType;
  projectPipelineVersions: ProjectPipelineVersions;
  selectedMedakaModel?: string;
  selectedGuppyBasecallerSetting?: string;
  selectedTechnology?: string;
  selectedWetlabProtocol?: string;
  selectedWorkflows?: Set<string>;
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
  onClearLabsChange,
  onMedakaModelChange,
  onTechnologyToggle,
  onGuppyBasecallerSettingChange,
  onWetlabProtocolChange,
  onWorkflowToggle,
  currentTab,
  projectPipelineVersions,
  selectedMedakaModel,
  selectedGuppyBasecallerSetting,
  selectedTechnology,
  selectedWetlabProtocol,
  selectedWorkflows,
  s3UploadEnabled,
  usedClearLabs,
}: WorkflowSelectorProps) => {
  const userContext = useContext(UserContext);
  const { allowedFeatures } = userContext || {};

  const shouldDisableWorkflowOption = (workflow: string) => {
    const workflowIsCurrentlySelected = selectedWorkflows.has(workflow);
    const selectedMNGSNanopore =
      selectedWorkflows.has(UPLOAD_WORKFLOWS.MNGS.value) &&
      selectedTechnology === SEQUENCING_TECHNOLOGY_OPTIONS.NANOPORE;

    switch (workflow) {
      case UPLOAD_WORKFLOWS.MNGS.value:
        return (
          !workflowIsCurrentlySelected &&
          selectedWorkflows.has(UPLOAD_WORKFLOWS.CONSENSUS_GENOME.value)
        );
      case UPLOAD_WORKFLOWS.AMR.value:
        return (
          !workflowIsCurrentlySelected &&
          (selectedWorkflows.has(UPLOAD_WORKFLOWS.CONSENSUS_GENOME.value) ||
            selectedMNGSNanopore)
        );
      case UPLOAD_WORKFLOWS.CONSENSUS_GENOME.value:
        return !workflowIsCurrentlySelected && size(selectedWorkflows) > 0;
    }
  };

  return (
    <div className={cs.workflowSelector}>
      <div className={cs.header}>Analysis Type</div>
      <AnalysisType
        description={
          allowedFeatures.includes(ONT_V1_FEATURE)
            ? "Run your samples through our metagenomics pipeline. Our pipeline supports Illumina and Nanopore technologies."
            : "Run your samples through our metagenomics pipeline. Our pipeline only supports Illumina."
        }
        isDisabled={shouldDisableWorkflowOption(UPLOAD_WORKFLOWS.MNGS.value)}
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
        title={UPLOAD_WORKFLOWS.MNGS.label}
      />
      <AnalysisType
        description="Run your samples through our antimicrobial resistance pipeline. Our pipeline supports metagenomics or whole genome data. It only supports Illumina. You can also run the AMR pipeline from within an existing project by selecting previously uploaded mNGS samples."
        isBeta
        isDisabled={
          allowedFeatures.includes(AMR_V1_FEATURE) &&
          shouldDisableWorkflowOption(UPLOAD_WORKFLOWS.AMR.value)
        }
        onClick={() => onWorkflowToggle(UPLOAD_WORKFLOWS.AMR.value)}
        isSelected={selectedWorkflows.has(UPLOAD_WORKFLOWS.AMR.value)}
        sdsIcon={UPLOAD_WORKFLOWS.AMR.icon}
        shouldHideOption={!allowedFeatures.includes(AMR_V1_FEATURE)}
        title={UPLOAD_WORKFLOWS.AMR.label}
        sequencingPlatformOptions={
          <div className={cs.technologyContent}>
            <PipelineVersionIndicator
              version={projectPipelineVersions?.[WORKFLOWS.AMR.value]}
            />
          </div>
        }
      />
      <AnalysisType
        description="Run your samples through our Illumina or Nanopore supported pipelines to get consensus genomes for SARS-CoV-2."
        isDisabled={shouldDisableWorkflowOption(
          UPLOAD_WORKFLOWS.CONSENSUS_GENOME.value,
        )}
        onClick={() =>
          onWorkflowToggle(UPLOAD_WORKFLOWS.CONSENSUS_GENOME.value)
        }
        isSelected={selectedWorkflows.has(
          UPLOAD_WORKFLOWS.CONSENSUS_GENOME.value,
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
        sdsIcon={UPLOAD_WORKFLOWS.CONSENSUS_GENOME.icon}
        title={UPLOAD_WORKFLOWS.CONSENSUS_GENOME.label}
      />
    </div>
  );
};

export { WorkflowSelector };
