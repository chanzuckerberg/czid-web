import { Button } from "czifui";
import { get } from "lodash/fp";
import React from "react";
import { withAnalytics } from "~/api/analytics";
import {
  isMngsWorkflow,
  WORKFLOWS,
  WORKFLOW_VALUES,
} from "~/components/utils/workflows";
import PipelineVersionSelect from "~/components/views/components/PipelineVersionSelect";
import Sample, { WorkflowRun } from "~/interface/sample";
import { PipelineRun } from "~/interface/shared";
import cs from "./secondary_header_controls.scss";

interface SecondaryHeaderControlsProps {
  sample: Sample;
  currentRun: WorkflowRun | PipelineRun;
  getAllRuns: () => WorkflowRun[] | PipelineRun[];
  workflow: WORKFLOW_VALUES;
  onPipelineVersionChange: (newPipelineVersion: string) => void;
  userIsAdmin: boolean;
  onDetailsClick: () => void;
}

export const SecondaryHeaderControls = ({
  sample,
  currentRun,
  getAllRuns,
  workflow,
  onPipelineVersionChange,
  userIsAdmin,
  onDetailsClick,
}: SecondaryHeaderControlsProps) => {
  return (
    <div className={cs.controlsTopRowContainer}>
      <PipelineVersionSelect
        sampleId={get("id", sample)}
        shouldIncludeDatabaseVersion={false}
        currentRun={currentRun}
        allRuns={getAllRuns()}
        workflowType={workflow}
        versionKey={
          isMngsWorkflow(workflow) ? "pipeline_version" : "wdl_version"
        }
        timeKey={isMngsWorkflow(workflow) ? "created_at" : "executed_at"}
        onVersionChange={onPipelineVersionChange}
      />
      {userIsAdmin && workflow !== WORKFLOWS.CONSENSUS_GENOME.value && (
        <>
          <Button
            className={cs.controlElement}
            sdsType="primary"
            sdsStyle="minimal"
            isAllCaps
            onClick={() =>
              (location.href = `/samples/${sample?.id}/pipeline_runs`)
            }
          >
            Pipeline Runs
          </Button>
          <span className={cs.seperator}> | </span>
        </>
      )}
      <Button
        sdsType="primary"
        sdsStyle="minimal"
        isAllCaps={true}
        onClick={withAnalytics(
          onDetailsClick,
          "SampleView_sample-details-link_clicked",
          {
            sampleId: sample?.id,
          },
        )}
      >
        Sample Details
      </Button>
    </div>
  );
};
