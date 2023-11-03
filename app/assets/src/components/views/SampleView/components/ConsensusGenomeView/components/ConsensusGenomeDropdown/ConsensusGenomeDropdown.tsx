import React from "react";
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

export const ConsensusGenomeDropdown = ({
  workflowRuns,
  initialSelectedValue,
  onConsensusGenomeSelection,
  ...props
}: ConsensusGenomeDropdownProps) => {
  // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2532
  const options = workflowRuns.map(wr => {
    const {
      // @ts-expect-error CZID-8698 enable strictNullChecks: error TS2339
      accession_id: accessionId,
      // @ts-expect-error CZID-8698 enable strictNullChecks: error TS2339
      accession_name: accessionName,
      // @ts-expect-error CZID-8698 enable strictNullChecks: error TS2339
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
