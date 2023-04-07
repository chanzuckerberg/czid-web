import React from "react";
import NarrowContainer from "~/components/layout/NarrowContainer";
import ViewHeader from "~/components/layout/ViewHeader";
import PipelineVersionSelect from "~/components/views/components/PipelineVersionSelect";
import Sample from "~/interface/sample";
import { PipelineRun } from "~/interface/shared";
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
    win.location = `${location.protocol}//${location.host}/samples/${sample.id}/pipeline_viz/${version}`;
  };

  // TODO: may need to update the props being passed into this component in the future to include some indication of the workflow type if we develop pipeline viz for workflows other than mNGS.
  const workflowType =
    pipelineRun?.technology === "Illumina"
      ? "short-read-mngs"
      : "long-read-mngs";

  return (
    <NarrowContainer>
      <ViewHeader className={cs.headerSection}>
        <ViewHeader.Content>
          <div className={cs.pipelineInfo}>
            <PipelineVersionSelect
              sampleId={sample.id}
              shouldIncludeDatabaseVersion={true}
              currentRun={pipelineRun}
              allRuns={pipelineVersions}
              onVersionChange={handlePipelineVersionSelect}
              versionKey={"pipeline_version"}
              timeKey={"created_at"}
              workflowType={workflowType}
            />
          </div>
          <ViewHeader.Pretitle breadcrumbLink={`/samples/${sample.id}`}>
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
