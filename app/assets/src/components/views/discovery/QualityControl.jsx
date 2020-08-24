import React from "react";
import PropTypes from "~/components/utils/propTypes";
import cx from "classnames";

import d3 from "d3";
import { head, sortBy } from "lodash/fp";
import { getSamples } from "~/api";
import InfoBanner from "./InfoBanner";
import Histogram from "~/components/visualizations/Histogram";
import InfoIconSmall from "~/components/ui/icons/InfoIconSmall";
import ImgVizSecondary from "~/components/ui/illustrations/ImgVizSecondary";
import ColumnHeaderTooltip from "~/components/ui/containers/ColumnHeaderTooltip";
import Notification from "~ui/notifications/Notification";

import { SAMPLE_TABLE_COLUMNS_V2 } from "~/components/views/samples/constants.js";
import cs from "./quality_control.scss";

const BAR_FILL_COLOR = "#A9BDFC";
const HOVER_BAR_FILL_COLOR = "#3867FA";
const BAR_CLICK_FILL_COLOR = "#223F9C";

class QualityControl extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      loading: true,
      samples: [],
      showProcessingSamplesMessage: true,
    };
  }

  componentDidMount() {
    this.fetchProjectSamples();
  }

  componentDidUpdate(prevProps, prevState) {
    const {
      loading,
      validSamples,
      totalReads,
      qualityReads,
      dcr,
      meanInsertSize,
    } = this.state;

    const { filtersSidebarOpen, sampleStatsSidebarOpen } = this.props;

    if (
      // Do not render histograms if loading or there are no samples to display
      (!loading &&
        validSamples.length > 0 &&
        validSamples !== prevState.validSamples) ||
      // Rerender the histograms if the sidepanels are toggled to scale their sizes appropriately
      !(
        filtersSidebarOpen === prevProps.filtersSidebarOpen &&
        sampleStatsSidebarOpen === prevProps.sampleStatsSidebarOpen
      )
    ) {
      const totalReadsFormat = d3.format(".2s");

      this.totalReadsHistogram = this.renderHistogram(
        this.totalReadsHistogramContainer,
        totalReads,
        "Total Reads",
        "Number of Samples",
        d => {
          return totalReadsFormat(d);
        }
      );
      this.qualityReadsHistogram = this.renderHistogram(
        this.qualityReadsHistogramContainer,
        qualityReads,
        "Percentage",
        "Number of Samples",
        d => {
          return d + "%";
        }
      );
      this.dcrHistogram = this.renderHistogram(
        this.dcrHistogramContainer,
        dcr,
        "DCR",
        "Number of Samples"
      );
      this.meanInsertSizeHistogram = this.renderHistogram(
        this.meanInsertSizeHistogramContainer,
        meanInsertSize,
        "Base pairs",
        "Number of Samples"
      );

      this.getBins();
    }
  }

  fetchProjectSamples = async () => {
    this.setState({ loading: true });
    const { projectId } = this.props;

    const projectSamples = await getSamples({
      projectId: projectId,
    });

    let data = this.extractData(projectSamples.samples);

    this.setState({
      loading: false,
      samples: projectSamples.samples,
      validSamples: data.validSamples,
      runningSamples: data.runningSamples,
      failedSamples: data.failedSamples,
      samplesDict: data.samplesDict,
      totalReads: data.totalReads,
      qualityReads: data.qualityReads,
      dcr: data.dcr,
      meanInsertSize: data.meanInsertSize,
    });
  };

  extractData(samples) {
    const validSamples = [];
    const runningSamples = [];
    const failedSamples = [];
    const totalReads = [];
    const qualityReads = [];
    const dcr = [];
    const meanInsertSize = [];
    const samplesDict = {};

    samples.forEach(sample => {
      const runInfo = sample.details.run_info;
      const pipelineRun = sample.details.derived_sample_output.pipeline_run;
      const summaryStats = sample.details.derived_sample_output.summary_stats;

      if (
        runInfo.result_status_description === "FAILED" ||
        runInfo.result_status_description === "COMPLETE - ISSUE" ||
        runInfo.result_status_description === "COMPLETE*"
      ) {
        failedSamples.push(sample);
      } else if (runInfo.report_ready) {
        validSamples.push(sample);
        totalReads.push(pipelineRun.total_reads);
        qualityReads.push(summaryStats.qc_percent);
        dcr.push(summaryStats.compression_ratio);
        meanInsertSize.push(summaryStats.insert_size_mean || 0);

        samplesDict[sample.id] = sample;
      } else {
        runningSamples.push(sample);
      }
    });

    return {
      validSamples,
      runningSamples,
      failedSamples,
      samplesDict,
      totalReads,
      qualityReads,
      dcr,
      meanInsertSize,
    };
  }

  getBins = () => {
    const { samplesDict } = this.state;
    const sampleIds = Object.keys(samplesDict);

    // Sort sample ids by the desired metric.
    const samplesByTotalReads = sortBy(
      id =>
        samplesDict[id].details.derived_sample_output.pipeline_run.total_reads,
      sampleIds
    );
    const samplesByQCPercent = sortBy(
      id =>
        samplesDict[id].details.derived_sample_output.summary_stats.qc_percent,
      sampleIds
    );
    const samplesBydcr = sortBy(
      id =>
        samplesDict[id].details.derived_sample_output.summary_stats
          .compression_ratio,
      sampleIds
    );
    const samplesByInsertSize = sortBy(
      id =>
        samplesDict[id].details.derived_sample_output.summary_stats
          .insert_size_mean,
      sampleIds
    );

    // For each histogram, bin the sample ids according to the bins generated by the underlying Histogram component.
    const totalReadsBins = this.extractBinData(
      head(this.totalReadsHistogram.bins),
      samplesByTotalReads
    );
    const qcPercentBins = this.extractBinData(
      head(this.qualityReadsHistogram.bins),
      samplesByQCPercent
    );
    const dcrBins = this.extractBinData(
      head(this.dcrHistogram.bins),
      samplesBydcr
    );
    const meanInsertSizeBins = this.extractBinData(
      head(this.meanInsertSizeHistogram.bins),
      samplesByInsertSize
    );

    this.setState({
      totalReadsBins,
      qcPercentBins,
      dcrBins,
      meanInsertSizeBins,
    });
  };

  extractBinData(histogramData, samples) {
    if (!histogramData) {
      return;
    }

    let startIndex = 0;
    const extractedBin = [];

    for (let binIndex = 0; binIndex < histogramData.length; binIndex++) {
      const bin = {};
      // TODO(julie): use min/max for tooltip displaying bin range
      bin.min = histogramData[binIndex].x0;
      bin.max = histogramData[binIndex].x1;

      const endIndex = startIndex + histogramData[binIndex].length;
      bin.samples = samples.slice(startIndex, endIndex);
      startIndex = endIndex;
      extractedBin[binIndex] = bin;
    }

    return extractedBin;
  }

  handleHistogramBarClick = (data, binIndex) => {
    const {
      totalReads,
      totalReadsBins,
      qualityReads,
      qcPercentBins,
      dcr,
      dcrBins,
      meanInsertSize,
      meanInsertSizeBins,
    } = this.state;
    const { handleBarClick } = this.props;

    let bin = [];
    if (data === totalReads) {
      bin = totalReadsBins[binIndex];
    } else if (data === qualityReads) {
      bin = qcPercentBins[binIndex];
    } else if (data === dcr) {
      bin = dcrBins[binIndex];
    } else if (data === meanInsertSize) {
      bin = meanInsertSizeBins[binIndex];
    }
    handleBarClick(bin.samples);
  };

  handleHistogramBarEnter = hoverData => {
    console.log();
  };

  handleHistogramBarHover = (clientX, clientY) => {
    this.setState({
      histogramTooltipLocation: {
        left: clientX,
        top: clientY,
      },
    });
  };

  handleHistogramBarExit = () => {
    this.setState({
      histogramTooltipLocation: null,
      histogramTooltipData: null,
    });
  };

  renderHistogram = (container, data, labelX, labelY, tickFormat) => {
    let histogram = new Histogram(container, data, {
      labelX: labelX,
      labelY: labelY,
      showStatistics: false,
      barOpacity: 1,
      colors: [BAR_FILL_COLOR],
      hoverColors: [HOVER_BAR_FILL_COLOR],
      clickColors: [BAR_CLICK_FILL_COLOR],
      simple: true,
      showGridlines: true,
      numTicksY: 5,
      labelYVerticalOffset: 122,
      xTickFormat: tickFormat,
      margins: {
        top: 10,
        right: 15,
        bottom: 35,
        left: 35,
      },
      onHistogramBarClick: this.handleHistogramBarClick,
      onHistogramBarHover: this.handleHistogramBarHover,
      onHistogramBarEnter: this.handleHistogramBarEnter,
      onHistogramBarExit: this.handleHistogramBarExit,
    });
    histogram.update();
    return histogram;
  };

  renderLoading() {
    return (
      <div className={cs.content}>
        <p className={cs.loadingIndicator}>
          <i className="fa fa-spinner fa-pulse fa-fw" />
          Loading...
        </p>
      </div>
    );
  }

  renderHistograms() {
    return (
      <div className={cs.content}>
        {this.renderSampleStatsInfo()}
        <div className={cs.chartsContainer}>
          <div className={cs.chart}>
            <div className={cs.title}>
              Do my samples have enough total reads?
            </div>
            <div className={cs.histogramContainer}>
              <div className={cs.subtitle}>
                Total Reads
                <ColumnHeaderTooltip
                  trigger={
                    <span>
                      <InfoIconSmall className={cs.infoIcon} />
                    </span>
                  }
                  title="Total Reads"
                  content={SAMPLE_TABLE_COLUMNS_V2.totalReads.tooltip}
                />
              </div>
              <div
                ref={histogramContainer => {
                  this.totalReadsHistogramContainer = histogramContainer;
                }}
              />
            </div>
          </div>
          <div className={cs.chart}>
            <div className={cs.title}>
              Do my samples have enough quality reads?
            </div>
            <div className={cs.histogramContainer}>
              <div className={cs.subtitle}>
                Passed QC
                <ColumnHeaderTooltip
                  trigger={
                    <span>
                      <InfoIconSmall className={cs.infoIcon} />
                    </span>
                  }
                  title="Quality Reads"
                  content={SAMPLE_TABLE_COLUMNS_V2.qcPercent.tooltip}
                  link={SAMPLE_TABLE_COLUMNS_V2.qcPercent.link}
                />
              </div>
              <div
                ref={histogramContainer => {
                  this.qualityReadsHistogramContainer = histogramContainer;
                }}
              />
            </div>
          </div>
          <div className={cs.chart}>
            <div className={cs.title}>
              Do my samples have enough sequence diversity?
            </div>
            <div className={cs.histogramContainer}>
              <div className={cs.subtitle}>
                Duplicate Compression Ratio
                <ColumnHeaderTooltip
                  trigger={
                    <span>
                      <InfoIconSmall className={cs.infoIcon} />
                    </span>
                  }
                  title="DCR"
                  content={
                    SAMPLE_TABLE_COLUMNS_V2.duplicateCompressionRatio.tooltip
                  }
                  link={SAMPLE_TABLE_COLUMNS_V2.duplicateCompressionRatio.link}
                />
              </div>
              <div
                ref={histogramContainer => {
                  this.dcrHistogramContainer = histogramContainer;
                }}
              />
            </div>
          </div>
          <div className={cs.chart}>
            <div className={cs.title}>
              Do my samples have sufficient insert lengths?
            </div>
            <div className={cs.histogramContainer}>
              <div className={cs.subtitle}>
                Mean Insert Size
                <ColumnHeaderTooltip
                  trigger={
                    <span>
                      <InfoIconSmall className={cs.infoIcon} />
                    </span>
                  }
                  title="Mean Insert Size"
                  content={SAMPLE_TABLE_COLUMNS_V2.meanInsertSize.tooltip}
                  link={SAMPLE_TABLE_COLUMNS_V2.meanInsertSize.link}
                />
              </div>
              <div
                ref={histogramContainer => {
                  this.meanInsertSizeHistogramContainer = histogramContainer;
                }}
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  hideprocessingSamplesMessage = () => {
    this.setState({ showProcessingSamplesMessage: false });
  };

  renderSampleStatsInfo = () => {
    const {
      samples,
      validSamples,
      runningSamples,
      failedSamples,
      showProcessingSamplesMessage,
    } = this.state;

    const content = (
      <React.Fragment>
        <ul className={cs.statusList}>
          <li className={cs.statusListItem}>
            {samples.length}{" "}
            {samples.length === 1 ? "sample has" : "samples have"} been
            uploaded.
          </li>
          <li className={cs.statusListItem}>
            {runningSamples.length}{" "}
            {runningSamples.length === 1 ? "sample is" : "samples are"} still
            being processed.
          </li>
          <li className={cs.statusListItem}>
            {failedSamples.length}{" "}
            {failedSamples.length === 1 ? "sample" : "samples"} failed to
            process. Failed samples are not displayed in the charts below.
          </li>
        </ul>
      </React.Fragment>
    );

    return (
      <div>
        {showProcessingSamplesMessage && runningSamples.length > 0 && (
          <Notification
            className={cx(
              cs.notification,
              showProcessingSamplesMessage ? cs.show : cs.hide
            )}
            type="info"
            displayStyle="flat"
            onClose={this.hideprocessingSamplesMessage}
            closeWithDismiss={false}
          >
            {runningSamples.length}{" "}
            {runningSamples.length === 1 ? "sample is" : "samples are"} still
            being processed.
          </Notification>
        )}
        <span className={cs.statsRow}>
          Showing {validSamples.length} of {samples.length} samples.
          <ColumnHeaderTooltip
            trigger={
              <span>
                <InfoIconSmall className={cs.infoIcon} />
              </span>
            }
            content={content}
          />
        </span>
      </div>
    );
  };

  renderBlankState() {
    return (
      <div className={cs.noDataBannerFlexContainer}>
        <InfoBanner
          className={cs.noDataBannerContainer}
          icon={<ImgVizSecondary />}
          link={{
            href: "https://help.idseq.net",
            text: "Learn about sample QC",
          }}
          message="You can visually check your QC metrics after your samples have successfully processed."
          title="Sample QC Visualizations"
          type="no_successful_samples"
        />
      </div>
    );
  }

  renderVisualization() {
    const { loading, validSamples } = this.state;
    const showBlankState = !loading && validSamples.length === 0;

    return showBlankState ? this.renderBlankState() : this.renderHistograms();
  }

  render() {
    const { loading } = this.state;
    // TODO(julie): fix resizing content when sidebars open/close
    return loading ? this.renderLoading() : this.renderVisualization();
  }
}

QualityControl.propTypes = {
  projectId: PropTypes.number,
  handleBarClick: PropTypes.func,
  sampleStatsSidebarOpen: PropTypes.bool,
  filtersSidebarOpen: PropTypes.bool,
};

export default QualityControl;
