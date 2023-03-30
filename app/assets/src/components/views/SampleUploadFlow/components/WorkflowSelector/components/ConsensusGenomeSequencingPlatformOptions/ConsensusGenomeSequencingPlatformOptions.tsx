import cx from "classnames";
import React from "react";
import { WORKFLOWS } from "~/components/utils/workflows";
import cs from "~/components/views/SampleUploadFlow/components/WorkflowSelector/workflow_selector.scss";
import { ProjectPipelineVersions, SampleUploadType } from "~/interface/shared";
import {
  SEQUENCING_TECHNOLOGY_OPTIONS,
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
  onTechnologyToggle(value: SEQUENCING_TECHNOLOGY_OPTIONS): void;
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
  const { CONSENSUS_GENOME } = UPLOAD_WORKFLOWS;
  const CG = CONSENSUS_GENOME.value;

  return (
    <div className={cs.optionText} onClick={e => e.stopPropagation()}>
      <div className={cx(cs.title, cs.technologyTitle)}>
        Sequencing Platform:
        <div className={cs.technologyOptions}>
          <IlluminaSequencingPlatformOption
            isCg
            isSelected={selectedTechnology === ILLUMINA}
            onClick={() => onTechnologyToggle(ILLUMINA)}
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
            onClick={() => onTechnologyToggle(NANOPORE)}
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
    </div>
  );
};

export { ConsensusGenomeSequencingPlatformOptions };
