import cx from "classnames";
import React from "react";
import { WorkflowType } from "~/components/utils/workflows";
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
      </div>
      <div className={cs.technologyOptions}>
        <IlluminaSequencingPlatformOption
          isCg
          isSelected={selectedTechnology === ILLUMINA}
          onClick={() => onTechnologyToggle(CG, ILLUMINA)}
          pipelineVersion={
            projectPipelineVersions?.[WorkflowType.CONSENSUS_GENOME]
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
          // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2322
          onClearLabsChange={onClearLabsChange}
          // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2322
          onMedakaModelChange={onMedakaModelChange}
          selectedMedakaModel={selectedMedakaModel}
          usedClearLabs={usedClearLabs}
          selectedWetlabProtocol={selectedWetlabProtocol}
          onWetlabProtocolChange={onWetlabProtocolChange}
          pipelineVersion={
            projectPipelineVersions?.[WorkflowType.CONSENSUS_GENOME]
          }
        />
      </div>
    </button>
  );
};

export { ConsensusGenomeSequencingPlatformOptions };
