import React from "react";
import PropTypes from "prop-types";
import { StickyContainer, Sticky } from "react-sticky";

import AMRHeatmapControls from "~/components/views/amr_heatmap/AMRHeatmapControls";
import AMRHeatmapVis from "~/components/views/amr_heatmap/AMRHeatmapVis";
import DetailsSidebar from "~/components/common/DetailsSidebar";
import ErrorBoundary from "~/components/ErrorBoundary";
import { getAMRCounts } from "~/api/amr";
import LoadingIcon from "~ui/icons/LoadingIcon";
import { ViewHeader, NarrowContainer } from "~/components/layout";

import cs from "./amr_heatmap_view.scss";

const METRICS = [
  { text: "Coverage", value: "coverage" },
  { text: "Depth", value: "depth" },
];

const VIEW_LEVELS = [
  { text: "Genes", value: "gene" },
  { text: "Alleles", value: "allele" },
];

const SCALES = [
  { text: "Logarithmic", value: "symlog" },
  { text: "Linear", value: "linear" },
];

const SIDEBAR_SAMPLE_MODE = "sampleDetails";
const SIDEBAR_GENE_MODE = "geneDetails";

export default class AMRHeatmapView extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      loading: true,
      selectedOptions: {
        metric: "coverage",
        viewLevel: "gene",
        scale: "symlog",
      },
      selectedSampleId: null,
      selectedGene: null,
      sidebarVisible: false,
      sidebarMode: null,
    };
  }

  componentDidMount() {
    const { sampleIds } = this.props;
    this.requestAMRCountsData(sampleIds);
  }

  async requestAMRCountsData(sampleIds) {
    const rawSampleData = await getAMRCounts(sampleIds);
    const samplesWithAMRCounts = rawSampleData.filter(
      sampleData => sampleData.error === ""
    );
    const maxValues = this.findMaxValues(samplesWithAMRCounts);
    this.setState({
      rawSampleData,
      samplesWithAMRCounts,
      sampleIds,
      maxValues,
      loading: false,
    });
  }

  assembleControlOptions() {
    // Controls are arranged in the order they are presented in
    return [
      { key: "viewLevel", options: VIEW_LEVELS, label: "View Level" },
      { key: "metric", options: METRICS, label: "Metric" },
      { key: "scale", options: SCALES, label: "Scale" },
    ];
  }

  findMaxValues(samplesWithAMRCounts) {
    const maxValues = samplesWithAMRCounts.reduce(
      (accum, currentSample) => {
        currentSample.amr_counts.forEach(amrCount => {
          accum.depth = Math.max(accum.depth, amrCount.depth);
          accum.coverage = Math.max(accum.coverage, amrCount.coverage);
        });
        return accum;
      },
      { depth: 0, coverage: 0 }
    );
    return maxValues;
  }

  //*** Callback methods ***

  updateOptions = options => {
    const { selectedOptions } = this.state;
    let newOptions = Object.assign({}, selectedOptions, options);
    this.setState({
      selectedOptions: newOptions,
    });
  };

  onSampleLabelClick = sampleId => {
    const { sidebarVisible, sidebarMode, selectedSampleId } = this.state;
    if (!sampleId) {
      this.setState({
        sidebarVisible: false,
      });
      return;
    }
    if (
      sidebarVisible &&
      sidebarMode === SIDEBAR_SAMPLE_MODE &&
      selectedSampleId === sampleId
    ) {
      this.setState({
        sidebarVisible: false,
      });
    } else {
      this.setState({
        selectedSampleId: sampleId,
        sidebarMode: SIDEBAR_SAMPLE_MODE,
        sidebarVisible: true,
      });
    }
  };

  onGeneLabelClick = geneName => {
    const { sidebarVisible, sidebarMode, selectedGene } = this.state;
    if (!geneName) {
      this.setState({
        sidebarVisible: false,
      });
      return;
    }
    if (
      sidebarVisible &&
      sidebarMode === SIDEBAR_GENE_MODE &&
      selectedGene === geneName
    ) {
      this.setState({
        sidebarVisible: false,
      });
    } else {
      this.setState({
        selectedGene: geneName,
        sidebarMode: SIDEBAR_GENE_MODE,
        sidebarVisible: true,
      });
    }
  };

  closeSidebar = () => {
    this.setState({
      sidebarVisible: false,
    });
  };

  //*** Post-update methods ***

  getSidebarParams() {
    const { sidebarMode, selectedSampleId, selectedGene } = this.state;
    switch (sidebarMode) {
      case SIDEBAR_SAMPLE_MODE: {
        return {
          sampleId: selectedSampleId,
          showReportLink: true,
        };
      }
      case SIDEBAR_GENE_MODE: {
        return {
          geneName: selectedGene,
        };
      }
      default: {
        return;
      }
    }
  }

  //*** Render methods ***

  renderHeader() {
    const { sampleIds } = this.props;
    return (
      <ViewHeader className={cs.viewHeader}>
        <ViewHeader.Content>
          <ViewHeader.Pretitle>
            Antimicrobial Resistance Heatmap
          </ViewHeader.Pretitle>
          <ViewHeader.Title
            label={`Comparing ${sampleIds ? sampleIds.length : ""} Samples`}
          />
        </ViewHeader.Content>
      </ViewHeader>
    );
  }

  renderControls() {
    const { selectedOptions, loading, maxValues } = this.state;
    const maxValueForLegend = maxValues ? maxValues[selectedOptions.metric] : 0;
    return (
      <AMRHeatmapControls
        controls={this.assembleControlOptions()}
        selectedOptions={selectedOptions}
        onSelectedOptionsChange={this.updateOptions}
        isDataReady={!loading}
        maxValueForLegend={maxValueForLegend}
      />
    );
  }

  renderVisualization() {
    const { loading, samplesWithAMRCounts, selectedOptions } = this.state;
    if (loading) {
      return (
        <p className={cs.loadingIndicator}>
          <LoadingIcon className={cs.loadingIndicator} />
          Loading...
        </p>
      );
    }
    return (
      <div className="row visualization-content">
        <ErrorBoundary>
          <AMRHeatmapVis
            samplesWithAMRCounts={samplesWithAMRCounts}
            selectedOptions={selectedOptions}
            onSampleLabelClick={this.onSampleLabelClick}
            onGeneLabelClick={this.onGeneLabelClick}
          />
        </ErrorBoundary>
      </div>
    );
  }

  renderSidebar() {
    const { sidebarMode, sidebarVisible } = this.state;
    return (
      <DetailsSidebar
        visible={sidebarVisible}
        mode={sidebarMode}
        onClose={this.closeSidebar}
        params={this.getSidebarParams()}
      />
    );
  }

  render() {
    return (
      <div className={cs.AMRHeatmapView}>
        <NarrowContainer>{this.renderHeader()}</NarrowContainer>
        <StickyContainer>
          <Sticky>
            {({ style }) => (
              <div style={style}>
                <NarrowContainer>{this.renderControls()}</NarrowContainer>
              </div>
            )}
          </Sticky>
          {this.renderVisualization()}
        </StickyContainer>
        {this.renderSidebar()}
      </div>
    );
  }
}

AMRHeatmapVis.propTypes = {
  sampleIds: PropTypes.array,
};
