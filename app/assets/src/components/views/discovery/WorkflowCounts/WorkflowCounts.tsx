import { isNil } from "lodash/fp";
import React from "react";
import { WorkflowType } from "~/components/utils/workflows";
import { ProjectCountsType } from "../DiscoveryViewFC";
import cs from "./workflow_counts.scss";

interface WorkflowCountsProps {
  workflowRunsProjectAggregates: ProjectCountsType | undefined;
  numberOfSamples: number;
  projectId: number;
}

export const WorkflowCounts = ({
  workflowRunsProjectAggregates: projectCounts,
  numberOfSamples,
  projectId,
}: WorkflowCountsProps) => {
  const {
    [WorkflowType.SHORT_READ_MNGS]: mngsRunsCount,
    [WorkflowType.CONSENSUS_GENOME]: cgRunsCount,
    [WorkflowType.AMR]: amrRunsCount,
  } = projectCounts?.[projectId] || {};

  const hasAllCounts =
    !isNil(numberOfSamples) &&
    !isNil(mngsRunsCount) &&
    !isNil(cgRunsCount) &&
    !isNil(amrRunsCount);

  if (!projectCounts || !hasAllCounts) {
    return <div className={cs.loadingBackgroundAnimation} />;
  }

  return (
    <div className={cs.counts}>
      <div
        className={cs.sampleCount}
        data-testid="sample-counts"
      >{`${numberOfSamples} Sample${numberOfSamples !== 1 ? "s" : ""}`}</div>
      <div className={cs.analysesCounts} data-testid="nmgs-cg-sample-counts">
        {`${mngsRunsCount} mNGS`} | {`${cgRunsCount} CG`}
        {` | ${amrRunsCount} AMR`}
      </div>
    </div>
  );
};
