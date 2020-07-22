import React from "react";

import ColumnHeaderTooltip from "~ui/containers/ColumnHeaderTooltip";
import RadioButton from "~ui/controls/RadioButton";
import IconSample from "~ui/icons/IconSample";
import InfoIconSmall from "~ui/icons/InfoIconSmall";
import { CONSENSUS_GENOME_DOC_LINK } from "~utils/documentationLinks";
import PropTypes from "~utils/propTypes";
import { WORKFLOWS } from "~utils/workflows";

import cs from "./workflow_selector.scss";

class WorkflowSelector extends React.Component {
  render() {
    const { onWorkflowToggle, selectedWorkflows = new Set() } = this.props;
    return (
      <div className={cs.workflowSelector}>
        <div className={cs.header}>Analysis Type</div>
        <div
          className={cs.workflowOption}
          onClick={() => onWorkflowToggle(WORKFLOWS.MAIN)}
        >
          <RadioButton
            selected={selectedWorkflows.has(WORKFLOWS.MAIN)}
            className={cs.radioButton}
          />
          <IconSample className={cs.iconSample} />
          <div className={cs.optionText}>
            <div className={cs.title}>Metagenomics</div>
            <div className={cs.description}>
              Run your samples through our metagenomics pipeline.
            </div>
          </div>
        </div>
        <div
          className={cs.workflowOption}
          onClick={() => onWorkflowToggle(WORKFLOWS.CONSENSUS_GENOME)}
        >
          <RadioButton
            selected={selectedWorkflows.has(WORKFLOWS.CONSENSUS_GENOME)}
            className={cs.radioButton}
          />
          <IconSample className={cs.iconSample} />
          <div className={cs.optionText}>
            <div className={cs.title}>
              SARS-CoV-2 Consensus Genome
              <ColumnHeaderTooltip
                trigger={
                  <span>
                    <InfoIconSmall className={cs.infoIcon} />
                  </span>
                }
                content="Consensus genome aligns short reads to a SARS-CoV-2 reference genome."
                link={CONSENSUS_GENOME_DOC_LINK}
              />
            </div>
            <div className={cs.description}>
              Run your samples through our new pipeline to get consensus genomes
              for SARS-CoV-2. Our assembly supports wet lab protocols MSSPE and
              ARTIC v3.
            </div>
          </div>
        </div>
      </div>
    );
  }
}

WorkflowSelector.propTypes = {
  onWorkflowToggle: PropTypes.func,
  selectedWorkflows: PropTypes.instanceOf(Set),
};

export default WorkflowSelector;
