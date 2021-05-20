import React from "react";

import NarrowContainer from "~/components/layout/NarrowContainer";
import ViewHeader from "~/components/layout/ViewHeader";
import PropTypes from "~/components/utils/propTypes";
import PipelineVersionSelect from "~/components/views/SampleView/PipelineVersionSelect";

import cs from "./pipeline_viz.scss";

class PipelineVizHeader extends React.Component {
  // See SampleView.jsx
  renderVersionDisplay = () => {
    const { pipelineRun } = this.props;
    if (pipelineRun && pipelineRun.version && pipelineRun.version.pipeline) {
      const versionString = `v${pipelineRun.version.pipeline}`;
      const alignmentDBString = pipelineRun.version.alignment_db
        ? `, NT/NR: ${pipelineRun.version.alignment_db}`
        : "";

      return versionString + alignmentDBString;
    }
    return "";
  };

  handlePipelineVersionSelect = version => {
    const { sample } = this.props;
    window.location = `${location.protocol}//${location.host}/samples/${sample.id}/pipeline_viz/${version}`;
  };

  render() {
    const {
      pipelineRun,
      pipelineVersions,
      lastProcessedAt,
      sample,
    } = this.props;
    return (
      <NarrowContainer>
        <ViewHeader className={cs.headerSection}>
          <ViewHeader.Content>
            <div className={cs.pipelineInfo}>
              <span>PIPELINE {this.renderVersionDisplay()}</span>
              <PipelineVersionSelect
                pipelineRun={pipelineRun}
                pipelineVersions={pipelineVersions}
                lastProcessedAt={lastProcessedAt}
                onPipelineVersionSelect={this.handlePipelineVersionSelect}
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
  }
}

PipelineVizHeader.propTypes = {
  pipelineRun: PropTypes.PipelineRun,
  sample: PropTypes.Sample,
  pipelineVersions: PropTypes.arrayOf(PropTypes.string),
  lastProcessedAt: PropTypes.string,
};

export default PipelineVizHeader;
