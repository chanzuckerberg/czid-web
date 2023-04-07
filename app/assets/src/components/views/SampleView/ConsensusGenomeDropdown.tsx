import React from "react";
import { ANALYTICS_EVENT_NAMES, trackEvent } from "~/api/analytics";
import { WorkflowRun } from "~/interface/sample";
import SubtextDropdown from "~ui/controls/dropdowns/SubtextDropdown";
import cs from "./consensus_genome_dropdown.scss";

interface ConsensusGenomeDropdownProps {
  workflowRuns?: WorkflowRun[];
  disabled?: boolean;
  label?: string;
  onConsensusGenomeSelection: (workflowRunId: number) => void;
  rounded?: boolean;
  initialSelectedValue?: number;
}

const ConsensusGenomeDropdown = ({
  workflowRuns,
  initialSelectedValue,
  onConsensusGenomeSelection,
  ...props
}: ConsensusGenomeDropdownProps) => {
  const options = workflowRuns.map(wr => {
    const {
      accession_id: accessionId,
      accession_name: accessionName,
      taxon_name: taxonName,
    } = wr.inputs;

    return {
      text: taxonName,
      subtext: `${accessionId} - ${accessionName}`,
      value: wr.id,
    };
  });

  return (
    <SubtextDropdown
      menuClassName={cs.consensusGenomeDropdownMenu}
      options={options}
      initialSelectedValue={initialSelectedValue}
      onChange={(workflowRunId: number) => {
        onConsensusGenomeSelection(workflowRunId);
        trackEvent(
          ANALYTICS_EVENT_NAMES.CONSENSUS_GENOME_DROPDOWN_CONSENSUS_GENOME_SELECTED,
          { workflowRunId },
        );
      }}
      {...props}
    />
  );
};

ConsensusGenomeDropdown.defaultProps = {
  fluid: true,
  label: "Mapped to",
  rounded: true,
};

export default ConsensusGenomeDropdown;
