import { Button } from "@czi-sds/components";
import React from "react";
import { PipelineVersionSelect } from "~/components/common/PipelineVersionSelect";
import { WorkflowType } from "~/components/utils/workflows";
import Sample, { WorkflowRun } from "~/interface/sample";
import { PipelineRun } from "~/interface/shared";
import { PipelineRunsButton } from "./components/PipelineRunsButton";
import cs from "./secondary_header_controls.scss";

interface SecondaryHeaderControlsProps {
  sample: Sample | null;
  currentRun?: WorkflowRun | PipelineRun | null;
  getAllRuns: () =>
    | readonly (PipelineRun | null | undefined)[]
    | (WorkflowRun | null | undefined)[]
    | null
    | undefined;
  workflow: WorkflowType;
  onPipelineVersionChange: (newPipelineVersion: string) => void;
  onDetailsClick: () => void;
}

export const SecondaryHeaderControls = ({
  sample,
  currentRun,
  getAllRuns,
  workflow,
  onPipelineVersionChange,
  onDetailsClick,
}: SecondaryHeaderControlsProps) => {
  return (
    <div className={cs.controlsTopRowContainer}>
      {currentRun && (
        <PipelineVersionSelect
          currentRun={currentRun}
          allRuns={getAllRuns && getAllRuns()}
          workflowType={workflow}
          onVersionChange={onPipelineVersionChange}
        />
      )}
      {sample && <PipelineRunsButton sample={sample} workflow={workflow} />}
      <Button
        data-testid="sample-details"
        sdsType="primary"
        sdsStyle="minimal"
        isAllCaps={true}
        disabled={!sample}
        onClick={onDetailsClick}
      >
        Sample Details
      </Button>
    </div>
  );
};
