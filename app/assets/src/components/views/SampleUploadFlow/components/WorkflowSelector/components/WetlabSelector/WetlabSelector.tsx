import React from "react";
import { Dropdown } from "~/components/ui/controls/dropdowns";
import cs from "~/components/views/SampleUploadFlow/components/WorkflowSelector/workflow_selector.scss";
import {
  CG_NANOPORE_WETLAB_OPTIONS,
  CG_WETLAB_OPTIONS,
  SEQUENCING_TECHNOLOGY_OPTIONS,
} from "../../../../constants";

interface WetlabSelectorProps {
  onWetlabProtocolChange(value: string): void;
  selectedWetlabProtocol: string;
  technology: SEQUENCING_TECHNOLOGY_OPTIONS;
}

const WetlabSelector = ({
  onWetlabProtocolChange,
  selectedWetlabProtocol,
  technology,
}: WetlabSelectorProps) => {
  const handleChange = (value: string) => {
    onWetlabProtocolChange(value);
  };

  return (
    <Dropdown
      className={cs.dropdown}
      onChange={handleChange}
      options={
        technology === SEQUENCING_TECHNOLOGY_OPTIONS.ILLUMINA
          ? CG_WETLAB_OPTIONS
          : CG_NANOPORE_WETLAB_OPTIONS
      }
      placeholder="Select"
      value={selectedWetlabProtocol}
    />
  );
};

export { WetlabSelector };
