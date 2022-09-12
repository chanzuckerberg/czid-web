import cx from "classnames";
import { map, get } from "lodash/fp";
import React from "react";

import { trackEvent } from "~/api/analytics";
import PropTypes from "~/components/utils/propTypes";
import { findInWorkflows, WORKFLOWS } from "~/components/utils/workflows";
import { openUrlInNewTab } from "~utils/links";

import PipelineVersionSelect from "./PipelineVersionSelect";
import cs from "./workflow_version_header.scss";

export default function WorkflowVersionHeader({
  sampleId,
  currentRun,
  allRuns,
  workflowType,
  mngsWorkflow,
  versionKey,
  timeKey,
  onVersionChange,
  snapshotShareId,
}) {
  const renderAlignmentConfigString = () => {
    const alignmentConfigName = get("alignment_config_name", currentRun);
    const alignmentConfigNameString = alignmentConfigName
      ? `, NCBI Index Date: ${alignmentConfigName}`
      : "";
    return alignmentConfigNameString;
  };

  const renderCardDBString = () => {
    const cardVersion = "3.4.3";
    return ` CARD DB: ${cardVersion}`;
  };

  const renderWorkflowVersionString = () => {
    if (!currentRun[versionKey]) return;

    let workflowKey = findInWorkflows(workflowType, "value");
    let versionString = `${WORKFLOWS[workflowKey].label} Pipeline v${currentRun[versionKey]}`;

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
        pipelineRun={currentRun}
        pipelineVersions={[...new Set(map(versionKey, allRuns))]}
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

WorkflowVersionHeader.propTypes = {
  sampleId: PropTypes.number,
  currentRun: PropTypes.object,
  allRuns: PropTypes.array,
  workflowType: PropTypes.string,
  mngsWorkflow: PropTypes.bool,
  versionKey: PropTypes.string,
  timeKey: PropTypes.string,
  onVersionChange: PropTypes.func.isRequired,
  snapshotShareId: PropTypes.string,
};
