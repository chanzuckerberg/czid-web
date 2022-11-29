import cx from "classnames";
import { get } from "lodash/fp";
import React from "react";

import { trackEvent } from "~/api/analytics";
import { findInWorkflows, WORKFLOWS } from "~/components/utils/workflows";
import { WorkflowRun } from "~/interface/sample";
import { PipelineRun } from "~/interface/shared";
import { openUrlInNewTab } from "~utils/links";

import PipelineVersionSelect from "./PipelineVersionSelect";
import cs from "./workflow_version_header.scss";

interface WorkflowVersionHeaderProps {
  sampleId?: number;
  currentRun?: WorkflowRun | PipelineRun;
  allRuns?: WorkflowRun[] | PipelineRun[];
  workflowType?: string;
  mngsWorkflow?: boolean;
  versionKey?: string;
  timeKey?: string;
  onVersionChange: $TSFixMeFunction;
  snapshotShareId?: string;
}

export default function WorkflowVersionHeader({
  sampleId,
  currentRun,
  allRuns = [],
  workflowType,
  mngsWorkflow,
  versionKey,
  timeKey,
  onVersionChange,
  snapshotShareId,
}: WorkflowVersionHeaderProps) {
  const renderAlignmentConfigString = () => {
    const alignmentConfigName = get("alignment_config_name", currentRun);
    const alignmentConfigNameString = alignmentConfigName
      ? `, NCBI Index Date: ${alignmentConfigName}`
      : "";
    return alignmentConfigNameString;
  };

  const renderCardDBString = () => {
    const cardVersion = "3.2.3";
    return ` CARD DB: ${cardVersion}`;
  };

  const renderWorkflowVersionString = () => {
    if (!currentRun[versionKey]) return;

    const workflowKey = findInWorkflows(workflowType, "value");
    let versionString = `${WORKFLOWS[workflowKey].pipelineName} Pipeline v${currentRun[versionKey]}`;

    if (mngsWorkflow) {
      versionString += renderAlignmentConfigString();
    }

    if (workflowType === WORKFLOWS.AMR.value) {
      versionString += renderCardDBString();
    }

    return versionString;
  };

  return (
    <div
      className={cx(
        cs.pipelineInfo,
        !snapshotShareId &&
          mngsWorkflow &&
          get(versionKey, currentRun) &&
          cs.linkToPipelineViz,
      )}
      onClick={() =>
        !snapshotShareId &&
        mngsWorkflow &&
        get(versionKey, currentRun) &&
        openUrlInNewTab(
          `/samples/${sampleId}/pipeline_viz/${get(versionKey, currentRun)}`,
        )
      }
    >
      <span className={cs.pipelineRunVersion}>
        {currentRun ? renderWorkflowVersionString() : " "}
      </span>
      <PipelineVersionSelect
        analysisRun={currentRun}
        pipelineVersions={[
          ...new Set(
            allRuns?.map((run: WorkflowRun | PipelineRun) => run[versionKey]),
          ),
        ]}
        versionKey={versionKey}
        lastProcessedAt={get(timeKey, currentRun)}
        onPipelineVersionSelect={version => {
          trackEvent("SampleView_pipeline-select_clicked", {
            sampleId,
            pipelineVersion: version,
            workflowType,
          });
          onVersionChange(version);
        }}
      />
    </div>
  );
}
