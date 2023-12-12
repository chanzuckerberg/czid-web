import cx from "classnames";
import { find, size } from "lodash/fp";
import React from "react";
import { WorkflowType } from "~/components/utils/workflows";
import { RUNNING_STATE } from "~/components/views/SampleView/utils";
import Sample, { WorkflowRun } from "~/interface/sample";
import ExternalLink from "~ui/controls/ExternalLink";
import { IconArrowRight } from "~ui/icons";
import cs from "../../consensus_genome_view.scss";
import { getConsensusGenomeHelpLink } from "../../utils";
import { ConsensusGenomeDropdown } from "./components/ConsensusGenomeDropdown";

interface ConsensusGenomeHeaderProps {
  onWorkflowRunSelect: $TSFixMeFunction;
  sample: Sample;
  workflowRun: WorkflowRun;
}

export const ConsensusGenomeHeader = ({
  sample,
  workflowRun,
  onWorkflowRunSelect,
}: ConsensusGenomeHeaderProps) => {
  const helpLinkUrl = getConsensusGenomeHelpLink(
    workflowRun?.inputs?.accession_id,
  );

  const consensusGenomeWorkflowRuns = sample.workflow_runs?.filter(
    run => run.workflow === WorkflowType.CONSENSUS_GENOME,
  );

  const shouldRenderCGDropdown = size(consensusGenomeWorkflowRuns) > 1;

  return (
    <div
      className={cx(
        cs.headerContainer,
        !shouldRenderCGDropdown && cs.removeBottomMargin,
      )}
    >
      {shouldRenderCGDropdown && consensusGenomeWorkflowRuns && (
        <div className={cs.dropdownContainer}>
          <ConsensusGenomeDropdown
            workflowRuns={consensusGenomeWorkflowRuns}
            initialSelectedValue={workflowRun?.id}
            onConsensusGenomeSelection={workflowRunId =>
              onWorkflowRunSelect(
                find({ id: workflowRunId }, consensusGenomeWorkflowRuns),
              )
            }
          />
        </div>
      )}
      {workflowRun.status !== RUNNING_STATE && (
        <ExternalLink
          className={cx(
            cs.learnMoreLink,
            !shouldRenderCGDropdown && cs.alignRight,
          )}
          href={helpLinkUrl}
          analyticsEventName={"ConsensusGenomeView_learn-more-link_clicked"}
        >
          Learn more about consensus genomes <IconArrowRight />
        </ExternalLink>
      )}
    </div>
  );
};
