import React from "react";
import PropTypes from "prop-types";
import AMRHeatmapVis from "~/components/views/amr_heatmap/AMRHeatmapVis";
import AMRHeatmapHeader from "~/components/views/amr_heatmap/AMRHeatmapHeader";
import AMRHeatmapControls from "~/components/views/amr_heatmap/AMRHeatmapControls";
import { NarrowContainer } from "~/components/layout";
import ErrorBoundary from "~/components/ErrorBoundary";
import { StickyContainer, Sticky } from "react-sticky";

import cs from "./amr_heatmap_view.scss";

const METRICS = [
  { text: "Coverage", value: "coverage" },
  { text: "Depth", value: "depth" },
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
    this.setState({
      sampleIds: this.props.sampleIds,
      loading: false,
    });
    console.log(this);
  }

  componentDidUpdate() {}

  assembleControlOptions() {
    return {
      metrics: METRICS,
    };
  }

  updateOptions = options => {
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
          Loading..
        </p>
      );
    }
    // else...
    return (
      <div className="row visualization-content">
        <ErrorBoundary>
          <AMRHeatmapVis
            sampleIds={this.state.sampleIds}
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
