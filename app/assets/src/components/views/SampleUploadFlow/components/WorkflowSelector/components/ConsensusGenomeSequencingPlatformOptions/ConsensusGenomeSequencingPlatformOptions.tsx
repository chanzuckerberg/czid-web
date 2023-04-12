import cx from "classnames";
import React from "react";
import { WORKFLOWS } from "~/components/utils/workflows";
import cs from "~/components/views/SampleUploadFlow/components/WorkflowSelector/workflow_selector.scss";
import { ProjectPipelineVersions, SampleUploadType } from "~/interface/shared";
import {
  SEQUENCING_TECHNOLOGY_OPTIONS,
  UploadWorkflows,
  UPLOAD_WORKFLOWS,
} from "../../../../constants";
import { shouldDisableSequencingPlatformOption } from "../../WorkflowSelector";
import { IlluminaSequencingPlatformOption } from "../IlluminaSequencingPlatformOption";
import { ConsensusGenomeWithNanopore } from "./components/ConsensusGenomeWithNanopore";

interface ConsensusGenomeSequencingPlatformOptionsProps {
  currentTab: SampleUploadType;
  isS3UploadEnabled: boolean;
  onClearLabsChange?: (usedClearLabs: boolean) => void;
  onMedakaModelChange?: (selected: string) => void;
  onTechnologyToggle(
    workflow: UploadWorkflows,
    technology: SEQUENCING_TECHNOLOGY_OPTIONS,
  ): void;
  onWetlabProtocolChange(value: string): void;
  selectedMedakaModel: string;
  selectedTechnology: string;
  selectedWetlabProtocol: string;
  usedClearLabs: boolean;
  projectPipelineVersions?: ProjectPipelineVersions;
}

const ConsensusGenomeSequencingPlatformOptions = ({
  currentTab,
  isS3UploadEnabled,
  onClearLabsChange,
  onMedakaModelChange,
  onTechnologyToggle,
  onWetlabProtocolChange,
  selectedMedakaModel,
  selectedTechnology,
  selectedWetlabProtocol,
  usedClearLabs,
  projectPipelineVersions,
}: ConsensusGenomeSequencingPlatformOptionsProps) => {
  const { ILLUMINA, NANOPORE } = SEQUENCING_TECHNOLOGY_OPTIONS;
  const { COVID_CONSENSUS_GENOME } = UPLOAD_WORKFLOWS;
  const CG = COVID_CONSENSUS_GENOME.value;

  return (
    <button
      className={cx(cs.optionText, "noStyleButton")}
      onClick={e => e.stopPropagation()}
    >
      <div className={cx(cs.title, cs.technologyTitle)}>
        Sequencing Platform:
        <div className={cs.technologyOptions}>
          <IlluminaSequencingPlatformOption
            isCg
            isSelected={selectedTechnology === ILLUMINA}
            onClick={() => onTechnologyToggle(CG, ILLUMINA)}
            pipelineVersion={
              projectPipelineVersions?.[WORKFLOWS.CONSENSUS_GENOME.value]
            }
            onWetlabProtocolChange={onWetlabProtocolChange}
          />
          <ConsensusGenomeWithNanopore
            isDisabled={shouldDisableSequencingPlatformOption(
              currentTab,
              NANOPORE,
              CG,
            )}
            isSelected={selectedTechnology === NANOPORE}
            isS3UploadEnabled={isS3UploadEnabled}
            onClick={() => onTechnologyToggle(CG, NANOPORE)}
            onClearLabsChange={onClearLabsChange}
            onMedakaModelChange={onMedakaModelChange}
            selectedMedakaModel={selectedMedakaModel}
            usedClearLabs={usedClearLabs}
            selectedWetlabProtocol={selectedWetlabProtocol}
            onWetlabProtocolChange={onWetlabProtocolChange}
            pipelineVersion={
              projectPipelineVersions?.[WORKFLOWS.CONSENSUS_GENOME.value]
            }
          />
        </div>
      </div>
    </button>
  );
};

export { ConsensusGenomeSequencingPlatformOptions };
