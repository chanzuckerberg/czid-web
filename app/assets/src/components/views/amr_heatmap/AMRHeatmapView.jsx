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
import { DownloadButtonDropdown } from "~ui/controls/dropdowns";

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

const DOWNLOAD_OPTIONS = [{ text: "Download CSV", value: "csv" }];

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
    const filteredSamples = rawSampleData.filter(
      sampleData => sampleData.error === ""
    );
    const samplesWithAMRCounts = this.processAMRCounts(filteredSamples);
    const maxValues = this.findMaxValues(samplesWithAMRCounts);
    this.setState({
      rawSampleData,
      samplesWithAMRCounts,
      sampleIds,
      maxValues,
      loading: false,
    });
  }

  processAMRCounts(filteredSamples) {
    filteredSamples.forEach(sample => {
      sample.amr_counts.forEach(amrCount => {
        // The following three lines are a kind of hacky workaround to the fact that
        // the amr counts stored in the db have a gene name that includes the actual gene
        // plus the drug class.
        const geneNameExtractionRegex = /[^_]+/; // matches everything before the first underscore
        const geneName = geneNameExtractionRegex.exec(amrCount.gene)[0];
        amrCount.gene = geneName;
      });
    });

    return filteredSamples;
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
      this.closeSidebar();
      return;
    }
    if (
      sidebarVisible &&
      sidebarMode === SIDEBAR_SAMPLE_MODE &&
      selectedSampleId === sampleId
    ) {
      this.closeSidebar();
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
    if (
      !geneName ||
      (sidebarVisible &&
        sidebarMode === SIDEBAR_GENE_MODE &&
        selectedGene === geneName)
    ) {
      this.closeSidebar();
      return;
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

  computeHeatmapValuesForCSV() {
    const { samplesWithAMRCounts } = this.state;
    const csvData = samplesWithAMRCounts.flatMap(sample => {
      const csvRow = sample.amr_counts.map(amrCount => {
        const row = [
          `${sample.sample_name},${amrCount.gene},${amrCount.allele},${
            amrCount.coverage
          },${amrCount.depth}`,
        ];
        return row;
      });
      return csvRow;
    });
    csvData.unshift(["sample_name,gene_name,allele_name,coverage,depth"]);
    const csvDataString = csvData.join("\n");
    return csvDataString;
  }

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

  getDownloadCSVLink(csvOption) {
    const dataString = this.computeHeatmapValuesForCSV();
    const dataBlob = new Blob([dataString], { type: "text/csv" });
    return (
      <a
        href={URL.createObjectURL(dataBlob)}
        download="idseq_amr_heatmap_values.csv"
        target="_blank"
        rel="noopener noreferrer"
        key={`${csvOption.text}_csv_link`}
      >
        {csvOption.text}
      </a>
    );
  }

  getDownloadOptions() {
    const downloadOptions = DOWNLOAD_OPTIONS;
    const csvOptionIndex = downloadOptions.findIndex(
      element => element.value === "csv"
    );
    downloadOptions[csvOptionIndex].text = this.getDownloadCSVLink(
      downloadOptions[csvOptionIndex]
    );
    return downloadOptions;
  }

  //*** Render methods ***

  renderHeader() {
    const { sampleIds } = this.props;
    const { loading } = this.state;
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
        {!loading && (
          <ViewHeader.Controls className={cs.controls}>
            <DownloadButtonDropdown
              className={cs.controlElement}
              options={this.getDownloadOptions()}
              disabled={loading}
            />
          </ViewHeader.Controls>
        )}
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
