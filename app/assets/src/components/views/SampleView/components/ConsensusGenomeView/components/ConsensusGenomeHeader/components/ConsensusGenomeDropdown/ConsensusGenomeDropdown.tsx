import { Dropdown } from "@czi-sds/components";
import React from "react";
import { WorkflowRun } from "~/interface/sample";
import cs from "./consensus_genome_dropdown.scss";

interface ConsensusGenomeDropdownProps {
  workflowRuns: WorkflowRun[];
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
}: ConsensusGenomeDropdownProps) => {
  const options = workflowRuns.map(wr => {
    const {
      accession_id: accessionId,
      accession_name: accessionName,
      taxon_name: taxonName,
    } = wr.inputs;

    return {
      name: taxonName,
      details: `${accessionId} - ${accessionName}`,
      value: wr.id,
    };
  });
  const nameFromValue = (value: number | undefined) => {
    const option = options.find(o => o.value === value);
    return option?.name;
  };
  return (
    <Dropdown
      className={cs.consensusGenomeDropdownMenu}
      label="Mapped to"
      options={options}
      onChange={option => {
        option && onConsensusGenomeSelection(option["value"]);
      }}
      InputDropdownProps={{
        sdsStyle: "rounded",
        sdsType: "label",
        value: nameFromValue(initialSelectedValue),
      }}
    />
  );
};
