import React from "react";

import NarrowContainer from "~/components/layout/NarrowContainer";
import ViewHeader from "~/components/layout/ViewHeader";
import PipelineVersionSelect from "~/components/views/SampleView/PipelineVersionSelect";
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
  lastProcessedAt,
  sample,
}: PipelineVizHeaderProps) => {
  // See SampleView.jsx
  const renderVersionDisplay = () => {
    if (pipelineRun && pipelineRun.version && pipelineRun.version.pipeline) {
      const versionString = `v${pipelineRun.version.pipeline}`;
      const alignmentDBString = pipelineRun.version.alignment_db
        ? `, NT/NR: ${pipelineRun.version.alignment_db}`
        : "";

      return versionString + alignmentDBString;
    }
    return "";
  };

  const handlePipelineVersionSelect = version => {
    const win: Window = window;
    win.location = `${location.protocol}//${location.host}/samples/${sample.id}/pipeline_viz/${version}`;
  };
  return (
    <NarrowContainer>
      <ViewHeader className={cs.headerSection}>
        <ViewHeader.Content>
          <div className={cs.pipelineInfo}>
            <span>PIPELINE {renderVersionDisplay()}</span>
            <PipelineVersionSelect
              analysisRun={pipelineRun}
              pipelineVersions={pipelineVersions}
              lastProcessedAt={lastProcessedAt}
              onPipelineVersionSelect={handlePipelineVersionSelect}
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
