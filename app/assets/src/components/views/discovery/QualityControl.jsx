import React from "react";
import PropTypes from "~/components/utils/propTypes";

import d3 from "d3";
import { getSamples } from "~/api";
import Histogram from "~/components/visualizations/Histogram";
import InfoIconSmall from "~/components/ui/icons/InfoIconSmall";
import ColumnHeaderTooltip from "~/components/ui/containers/ColumnHeaderTooltip";

import { SAMPLE_TABLE_COLUMNS_V2 } from "~/components/views/samples/constants.js";
import cs from "./quality_control.scss";

const BAR_FILL_COLOR = "#A9BDFC";
const HOVER_BAR_FILL_COLOR = "#3867FA";

class QualityControl extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      loading: true,
      samples: [],
    };
  }

  componentDidMount() {
    this.fetchProjectSamples();
  }

  componentDidUpdate(prevProps, prevState) {
    const {
      loading,
      samples,
      totalReads,
      qualityReads,
      DCR,
      meanInsertSize,
    } = this.state;

    if (samples !== prevState.samples && !loading) {
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
      this.DCRHistogram = this.renderHistogram(
        this.DCRHistogramContainer,
        DCR,
        "DCR",
        "Number of Samples"
      );
      this.meanInsertSizeHistogram = this.renderHistogram(
        this.meanInsertSizeHistogramContainer,
        meanInsertSize,
        "Base pairs",
        "Number of Samples"
      );
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
      totalReads: data.totalReads,
      qualityReads: data.qualityReads,
      DCR: data.DCR,
      meanInsertSize: data.meanInsertSize,
    });
  };

  extractData(samples) {
    let validSamples = [];
    let runningSamples = [];
    let failedSamples = [];
    let totalReads = [];
    let qualityReads = [];
    let DCR = [];
    let meanInsertSize = [];

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
        DCR.push(summaryStats.compression_ratio);
        meanInsertSize.push(summaryStats.insert_size_mean || 0);
      } else {
        runningSamples.push(sample);
      }
    });
    return {
      validSamples,
      runningSamples,
      failedSamples,
      totalReads,
      qualityReads,
      DCR,
      meanInsertSize,
    };
  }

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
      showGridlines: true,
      numTicksY: 5,
      simple: true,
      labelYVerticalOffset: 122,
      xTickFormat: tickFormat,
      margins: {
        top: 30,
        right: 40,
        bottom: 40,
        left: 40,
      },
      onHistogramBarHover: this.handleHistogramBarHover,
      onHistogramBarEnter: this.handleHistogramBarEnter,
      onHistogramBarExit: this.handleHistogramBarExit,
    });
    histogram.update();
    return histogram;
  };

  renderLoading() {
    return (
      <p className={cs.loadingIndicator}>
        <i className="fa fa-spinner fa-pulse fa-fw" />
        Loading...
      </p>
    );
  }

  renderHistograms() {
    return (
      <div>
        {this.renderSampleStatsInfo()}
        <div className={cs.row}>
          <div className={cs.chartContainer}>
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
          <div className={cs.chartContainer}>
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
        </div>
        <div className={cs.row}>
          <div className={cs.chartContainer}>
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
                  this.DCRHistogramContainer = histogramContainer;
                }}
              />
            </div>
          </div>
          <div className={cs.chartContainer}>
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

  renderSampleStatsInfo = () => {
    const { samples, validSamples, runningSamples, failedSamples } = this.state;

    const content = (
      <div>
        <div>
          {samples.length}{" "}
          {samples.length === 1 ? "sample has" : "samples have"} been uploaded.
        </div>
        <div>
          {runningSamples.length}{" "}
          {runningSamples.length === 1 ? "sample is" : "samples are"} still
          being processed.
        </div>
        <div>
          {failedSamples.length}{" "}
          {failedSamples.length === 1 ? "sample" : "samples"} failed to process.
          Failed samples are not displayed in the charts below.
        </div>
      </div>
    );

    return (
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
    );
  };

  render() {
    // TODO(julie): fix resizing content when sidebars open/close
    return (
      <div className={cs.content}>
        {this.state.loading ? this.renderLoading() : this.renderHistograms()}
      </div>
    );
  }
}

QualityControl.propTypes = {
  projectId: PropTypes.number,
};

export default QualityControl;
