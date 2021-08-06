import React from "react";
import { ANALYTICS_EVENT_NAMES, logAnalyticsEvent } from "~/api/analytics";
import SubtextDropdown from "~ui/controls/dropdowns/SubtextDropdown";
import PropTypes from "~utils/propTypes";

import cs from "./consensus_genome_dropdown.scss";

const ConsensusGenomeDropdown = ({
  workflowRuns,
  initialSelectedValue,
  onConsensusGenomeSelection,
  ...props
}) => {
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
      onChange={workflowRunId => {
        onConsensusGenomeSelection(workflowRunId);
        logAnalyticsEvent(
          ANALYTICS_EVENT_NAMES.CONSENSUS_GENOME_DROPDOWN_CONSENSUS_GENOME_SELECTED,
          { workflowRunId }
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

ConsensusGenomeDropdown.propTypes = {
  workflowRuns: PropTypes.arrayOf(PropTypes.object),
  disabled: PropTypes.bool,
  label: PropTypes.string,
  onConsensusGenomeSelection: PropTypes.func.isRequired,
  rounded: PropTypes.bool,
  initialSelectedValue: PropTypes.number,
};

export default ConsensusGenomeDropdown;
