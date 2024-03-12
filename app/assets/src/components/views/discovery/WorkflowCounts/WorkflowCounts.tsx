import { isNil } from "lodash/fp";
import React from "react";
import { PreloadedQuery, usePreloadedQuery } from "react-relay";
import { isNotNullish } from "~/components/utils/typeUtils";
import { WorkflowType } from "~/components/utils/workflows";
import {
  DiscoveryViewFCFedWorkflowRunsAggregateQuery as DiscoveryViewFCFedWorkflowRunsAggregateQueryType,
  DiscoveryViewFCFedWorkflowRunsAggregateQuery$data,
} from "~/components/views/discovery/__generated__/DiscoveryViewFCFedWorkflowRunsAggregateQuery.graphql";
import { DiscoveryViewFCFedWorkflowRunsAggregateQuery } from "../DiscoveryViewFC";
import cs from "./workflow_counts.scss";

interface WorkflowCountsProps {
  projectWorkflowsAggregateQueryRef: PreloadedQuery<
    DiscoveryViewFCFedWorkflowRunsAggregateQueryType,
    Record<string, unknown>
  >;
  numberOfSamples: number;
  projectId: number;
}

type ProjectCountsType = {
  [key: number]: {
    [key: string]: number;
  };
};

const parseAggregateCounts = (
  aggregateQuery: DiscoveryViewFCFedWorkflowRunsAggregateQuery$data,
): ProjectCountsType | null => {
  const aggregateCounts = aggregateQuery.fedWorkflowRunsAggregate?.aggregate;

  if (!aggregateCounts) {
    return null;
  }

  const projectCounts = {};
  aggregateCounts.filter(isNotNullish).forEach(({ count, groupBy }) => {
    const { collectionId, workflowVersion } = groupBy;
    const { name } = workflowVersion.workflow;
    projectCounts[collectionId] = {
      ...projectCounts[collectionId],
      [name]: count,
    };
  });
  return projectCounts;
};

export const WorkflowCounts = ({
  projectWorkflowsAggregateQueryRef,
  numberOfSamples,
  projectId,
}: WorkflowCountsProps) => {
  const aggregateQuery = usePreloadedQuery(
    DiscoveryViewFCFedWorkflowRunsAggregateQuery,
    projectWorkflowsAggregateQueryRef,
  );

  const projectCounts = parseAggregateCounts(aggregateQuery);

  if (!projectCounts) {
    return null;
  }

  const {
    [WorkflowType.SHORT_READ_MNGS]: mngsRunsCount,
    [WorkflowType.CONSENSUS_GENOME]: cgRunsCount,
    [WorkflowType.AMR]: amrRunsCount,
  } = projectCounts[projectId] || {};

  const hasAllCounts =
    !isNil(numberOfSamples) &&
    !isNil(mngsRunsCount) &&
    !isNil(cgRunsCount) &&
    !isNil(amrRunsCount);

  if (!hasAllCounts) {
    return null;
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
