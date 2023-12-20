import React from "react";
import NarrowContainer from "~/components/layout/NarrowContainer";
import ViewHeader from "~/components/layout/ViewHeader";
import { WorkflowType } from "~/components/utils/workflows";
import Sample from "~/interface/sample";
import { PipelineRun } from "~/interface/shared";
import { PipelineVersionSelect } from "../components/PipelineVersionSelect";
import cs from "./pipeline_viz.scss";

interface PipelineVizHeaderProps {
  pipelineRun?: PipelineRun;
  sample?: Sample;
  pipelineVersions?: string[];
  lastProcessedAt?: string;
}

const PipelineVizHeader = ({
  pipelineRun,
  pipelineVersions,
  sample,
}: PipelineVizHeaderProps) => {
  // See SampleView.jsx

  const handlePipelineVersionSelect = (version: string) => {
    const win: Window = window;
    // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2532
    win.location = `${location.protocol}//${location.host}/samples/${sample.id}/pipeline_viz/${version}`;
  };

  // TODO: may need to update the props being passed into this component in the future to include some indication of the workflow type if we develop pipeline viz for workflows other than mNGS.
  const workflowType =
    pipelineRun?.technology === "Illumina"
      ? WorkflowType.SHORT_READ_MNGS
      : WorkflowType.LONG_READ_MNGS;

  return (
    <NarrowContainer>
      <ViewHeader className={cs.headerSection}>
        <ViewHeader.Content>
          <div className={cs.pipelineInfo}>
            <PipelineVersionSelect
              currentRun={pipelineRun}
              allRuns={pipelineVersions}
              onVersionChange={handlePipelineVersionSelect}
              workflowType={workflowType}
            />
          </div>
          {/* @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2532 */}
          <ViewHeader.Pretitle breadcrumbLink={`/samples/${sample.id}`}>
            {/* @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2532 */}
            {sample.name}
          </ViewHeader.Pretitle>
          <ViewHeader.Title label="Pipeline Visualization" />
        </ViewHeader.Content>
      </ViewHeader>
      <div className={cs.headerDivider} />
    </NarrowContainer>
  );
};

export default PipelineVizHeader;
