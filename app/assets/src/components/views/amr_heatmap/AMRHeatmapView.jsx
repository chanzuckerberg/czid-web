import React from "react";
import PropTypes from "prop-types";
import { StickyContainer, Sticky } from "react-sticky";

import AMRHeatmapVis from "~/components/views/amr_heatmap/AMRHeatmapVis";
import AMRHeatmapHeader from "~/components/views/amr_heatmap/AMRHeatmapHeader";
import AMRHeatmapControls from "~/components/views/amr_heatmap/AMRHeatmapControls";
import { NarrowContainer } from "~/components/layout";
import ErrorBoundary from "~/components/ErrorBoundary";
import { getAMRCounts } from "~/api/amr";

import cs from "./amr_heatmap_view.scss";

const METRICS = [
  { text: "Coverage", value: "coverage" },
  { text: "Depth", value: "depth" },
];

const VIEWLEVELS = [
  { text: "Genes", value: "genes" },
  { text: "Alleles", value: "alleles" },
];

export default class AMRHeatmapView extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      loading: true,
      selectedOptions: {
        metric: "coverage",
        viewLevel: "genes",
      },
    };
  }

  componentDidMount() {
    this.requestAMRCountsData(this.props.sampleIds);
  }

  componentDidUpdate() {}

  async requestAMRCountsData(sampleIds) {
    const rawSampleData = await getAMRCounts(sampleIds);
    const samplesWithAMRCounts = rawSampleData.filter(
      sampleData => sampleData.error === ""
    );
    this.setState({
      rawSampleData,
      samplesWithAMRCounts,
      sampleIds,
      loading: false,
    });
  }

  assembleControlOptions() {
    return {
      metrics: METRICS,
      viewLevels: VIEWLEVELS,
    };
  }

  updateOptions = options => {
    console.log(options);
    let newOptions = Object.assign({}, this.state.selectedOptions, options);
    this.setState({
      selectedOptions: newOptions,
    });
  };

  renderVisualization() {
    if (this.state.loading === true) {
      return (
        <p className={cs.loadingIndicator}>
          <i className="fa fa-spinner fa-pulse fa-fw" />
          Loading...
        </p>
      );
    }
    return (
      <div className="row visualization-content">
        <ErrorBoundary>
          <AMRHeatmapVis
            sampleIds={this.state.sampleIds}
            samplesWithAMRCounts={this.state.samplesWithAMRCounts}
            selectedOptions={this.state.selectedOptions}
          />
        </ErrorBoundary>
      </div>
    );
  }

  render() {
    return (
      <div className={cs.AMRHeatmapView}>
        <NarrowContainer>
          <AMRHeatmapHeader sampleIds={this.state.sampleIds} />
        </NarrowContainer>
        <StickyContainer>
          <Sticky>
            {({ style }) => (
              <div style={style}>
                <NarrowContainer>
                  <AMRHeatmapControls
                    options={this.assembleControlOptions()}
                    selectedOptions={this.state.selectedOptions}
                    onSelectedOptionsChange={this.updateOptions}
                    loading={this.state.loading}
                    data={true}
                  />
                </NarrowContainer>
              </div>
            )}
          </Sticky>
          {this.renderVisualization()}
        </StickyContainer>
      </div>
    );
  }
}

AMRHeatmapVis.propTypes = {
  sampleIds: PropTypes.array,
};
