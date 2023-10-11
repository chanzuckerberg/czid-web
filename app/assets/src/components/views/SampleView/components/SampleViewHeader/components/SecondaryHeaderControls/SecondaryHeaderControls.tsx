import { Button } from "@czi-sds/components";
import { get } from "lodash/fp";
import React from "react";
import { ANALYTICS_EVENT_NAMES, useWithAnalytics } from "~/api/analytics";
import { WorkflowType } from "~/components/utils/workflows";
import { PipelineVersionSelect } from "~/components/views/components/PipelineVersionSelect";
import Sample, { WorkflowRun } from "~/interface/sample";
import { PipelineRun } from "~/interface/shared";
import { PipelineRunsButton } from "./components/PipelineRunsButton";
import cs from "./secondary_header_controls.scss";

interface SecondaryHeaderControlsProps {
  sample: Sample | null;
  currentRun?: WorkflowRun | PipelineRun | null;
  getAllRuns: () => WorkflowRun[] | PipelineRun[] | undefined;
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
  const withAnalytics = useWithAnalytics();
  return (
    <div className={cs.controlsTopRowContainer}>
      {currentRun && (
        <PipelineVersionSelect
          sampleId={get("id", sample)}
          currentRun={currentRun}
          allRuns={getAllRuns()}
          workflowType={workflow}
          onVersionChange={onPipelineVersionChange}
          shouldIncludeDatabaseVersion={workflow === "amr"}
        />
      )}
      {sample && <PipelineRunsButton sample={sample} workflow={workflow} />}
      <Button
        data-testid="sample-details"
        sdsType="primary"
        sdsStyle="minimal"
        isAllCaps={true}
        disabled={!sample}
        onClick={withAnalytics(
          onDetailsClick,
          ANALYTICS_EVENT_NAMES.SAMPLE_VIEW_SAMPLE_DETAILS_LINK_CLICKED,
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
