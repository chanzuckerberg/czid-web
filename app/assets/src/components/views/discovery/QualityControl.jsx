import React from "react";
import PropTypes from "~/components/utils/propTypes";
import cx from "classnames";

import d3 from "d3";
import memoize from "memoize-one";
import { head, sortBy } from "lodash/fp";
import { getSamples, getSamplePipelineResults } from "~/api";
import InfoBanner from "./InfoBanner";
import Histogram from "~/components/visualizations/Histogram";
import InfoIconSmall from "~/components/ui/icons/InfoIconSmall";
import ImgVizSecondary from "~/components/ui/illustrations/ImgVizSecondary";
import ColumnHeaderTooltip from "~/components/ui/containers/ColumnHeaderTooltip";
import { TooltipVizTable } from "~ui/containers";
import { getTooltipStyle } from "~/components/utils/tooltip";
import Notification from "~ui/notifications/Notification";
import CategoricalLegend from "~/components/visualizations/legends/CategoricalLegend";
import HorizontalStackedBarChart from "~/components/visualizations/bar_charts/HorizontalStackedBarChart";
import DetailsSidebar from "~/components/common/DetailsSidebar/DetailsSidebar";
import BasicPopup from "~/components/BasicPopup";

import { SAMPLE_TABLE_COLUMNS_V2 } from "~/components/views/samples/constants.js";
import {
  BAR_FILL_COLOR,
  HOVER_BAR_FILL_COLOR,
  BAR_CLICK_FILL_COLOR,
  READS_LOST_STACK_COLORS,
  READS_REMAINING_COLOR,
  READS_REMAINING,
  HUMAN_READABLE_STEP_NAMES,
  HOST_FILTER_STAGE_NAME,
} from "./constants.js";
import cs from "./quality_control.scss";

class QualityControl extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      loading: true,
      samples: [],
      showProcessingSamplesMessage: true,
      sidebarVisible: false,
      sidebarParams: {
        sampleId: null,
      },
      histogramTooltipData: null,
      readsLostTooltipData: null,
    };
  }

  componentDidMount() {
    this.fetchProjectData();
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

  fetchProjectData = async () => {
    const { projectId } = this.props;

    const projectSamples = await getSamples({
      projectId: projectId,
    });

    let data = this.extractData(projectSamples.samples);

    const pipelineResultFetchers = data.validSamples.map(sample =>
      this.getPipelineResultForSample(sample)
    );
    const pipelineResults = await Promise.all(pipelineResultFetchers);
    const { categories, legendColors, readsLostData } = this.stackReadsLostData(
      pipelineResults
    );
    const chartColors = legendColors.map(({ color, label }) => color);

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
      readsLostData: readsLostData,
      readsLostLegendColors: legendColors,
      readsLostCategories: categories,
      readsLostChartColors: chartColors,
    });
  };

  stackReadsLostData(pipelineResults) {
    const categories = pipelineResults.reduce((accum, current) => {
      current.steps.forEach((step, index) => {
        if (!accum.includes(step.name)) {
          accum.splice(index, 0, step.name);
        }
      });
      return accum;
    }, []);

    categories.push(READS_REMAINING);

    const legendColors = categories.map((category, index) => {
      const colorIndex = index % READS_LOST_STACK_COLORS.length;
      return {
        color:
          category === READS_REMAINING
            ? READS_REMAINING_COLOR
            : READS_LOST_STACK_COLORS[colorIndex],
        label: category,
      };
    });

    const readsLostData = pipelineResults.map(sample => {
      const dataRow = {};
      let readsRemaining = sample.initialReads;
      let total = 0;
      sample.steps.forEach(step => {
        let readsAfter = step.readsAfter || readsRemaining;
        // The readsAfter column for CD Hit Dup returns the number of unique reads,
        // not the reads remaining. (FUN)
        if (step.name === "Identify duplicates") {
          readsAfter = readsRemaining;
        }
        const readsLost = readsRemaining - readsAfter;
        dataRow[step.name] = readsLost;
        total += readsLost;
        readsRemaining = readsAfter;
      });
      // account for every category
      categories.forEach(category => {
        if (!dataRow[category]) {
          dataRow[category] = 0;
        }
      });
      dataRow.total = sample.initialReads;
      dataRow.name = sample.name;
      dataRow[READS_REMAINING] = readsRemaining;

      return dataRow;
    });

    return { categories, legendColors, readsLostData };
  }

  getPipelineResultForSample = async sample => {
    const result = await getSamplePipelineResults(sample.id);
    // the key we want depends on if the sample went through a WDL pipeline or DAG pipeline
    const qualityControlSteps = Object.keys(result.displayedData).reduce(
      (accum, current) => {
        if (result.displayedData[current].name === HOST_FILTER_STAGE_NAME) {
          accum = result.displayedData[current].steps;
        }
        return accum;
      },
      {}
    );
    // check that step data exists
    if (!qualityControlSteps || Object.keys(qualityControlSteps).length === 0) {
      return {
        name: sample.name,
        initialReads: 0,
        steps: [],
      };
    }
    const qualityControlStepNames = Object.keys(qualityControlSteps);
    const initialReads =
      sample.details.derived_sample_output.pipeline_run.total_reads;
    const stepData = qualityControlStepNames.map(step => ({
      name:
        HUMAN_READABLE_STEP_NAMES[qualityControlSteps[step].name] ||
        qualityControlSteps[step].name,
      readsAfter: qualityControlSteps[step].readsAfter,
    }));
    const data = {
      name: sample.name,
      initialReads: initialReads,
      steps: stepData,
    };
    return data;
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
      const endIndex = startIndex + histogramData[binIndex].length;
      const bin = samples.slice(startIndex, endIndex);
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
    handleBarClick(bin);
  };

  handleHistogramBarEnter = (bin, data) => {
    const { totalReads, qualityReads, dcr, meanInsertSize } = this.state;

    let histogramTooltipData = {};
    if (data === totalReads) {
      histogramTooltipData = this.getHistogramTooltipData({
        bin: bin,
        label: "Total Reads",
        format: d3.format(".2s"),
      });
    } else if (data === qualityReads) {
      histogramTooltipData = this.getHistogramTooltipData({
        bin: bin,
        label: "Passed QC",
        format: d => {
          return d + "%";
        },
      });
    } else if (data === dcr) {
      histogramTooltipData = this.getHistogramTooltipData({
        bin: bin,
        label: "Ratio Number",
      });
    } else if (data === meanInsertSize) {
      histogramTooltipData = this.getHistogramTooltipData({
        bin: bin,
        label: "Base Pairs",
      });
    }

    this.setState({
      histogramTooltipData,
    });
  };

  getHistogramTooltipData = memoize(({ bin, label, format }) => {
    const binMin = format ? format(bin.x0) : bin.x0;
    const binMax = format ? format(bin.x1) : bin.x1;
    const samplesText = bin.length === 1 ? "sample" : "samples";

    return [
      {
        name: "Info",
        data: [
          [`${label}`, `${binMin}-${binMax}`],
          ["Number", `${bin.length} ${samplesText}`],
        ],
        disabled: false,
      },
    ];
  });

  handleChartElementHover = (clientX, clientY) => {
    const tooltipLocation =
      clientX && clientY ? { left: clientX, top: clientY } : null;
    this.setState({ tooltipLocation });
  };

  handleChartElementExit = () => {
    this.setState({
      tooltipLocation: null,
      tooltipClass: null,
      histogramTooltipData: null,
    });
  };

  handleHistogramEmptyClick = () => {
    const { handleBarClick } = this.props;
    handleBarClick([]);
  };

  handleSingleBarStackEnter = (sampleName, stepName, readsLost) => {
    const { readsLostLegendColors } = this.state;

    const stepLegend = readsLostLegendColors.find(
      legendData => legendData.label === stepName
    );

    const histogramTooltipData = [
      {
        name: "Info",
        data: [
          [
            <CategoricalLegend
              className={cs.inlineLegend}
              data={[stepLegend]}
            />,
            readsLost.toLocaleString(),
          ],
        ],
        disabled: false,
      },
    ];

    this.setState({
      histogramTooltipData,
    });
  };

  handleEmptyBarSpaceEnter = (sampleName, readsLostData) => {
    const { readsLostLegendColors, readsLostCategories } = this.state;

    const readsRemainingLegend = readsLostLegendColors.find(
      legendData => legendData.label === READS_REMAINING
    );
    const readsLostSummary = [];
    readsLostCategories.forEach(category => {
      if (category === READS_REMAINING) {
        return;
      }
      const categoryLegend = readsLostLegendColors.find(
        legendData => legendData.label === category
      );
      readsLostSummary.push([
        <CategoricalLegend
          className={cs.inlineLegend}
          data={[categoryLegend]}
          key={`${category}-summary-tooltip`}
        />,
        readsLostData[category].toLocaleString(),
      ]);
    });

    const histogramTooltipData = [
      {
        name: "Total reads",
        data: [["Total reads", readsLostData.total.toLocaleString()]],
        disabled: false,
      },
      {
        name: "Reads lost",
        data: readsLostSummary,
        disabled: false,
      },
      {
        name: READS_REMAINING,
        data: [
          [
            <CategoricalLegend
              className={cs.inlineLegend}
              data={[readsRemainingLegend]}
              key={`${READS_REMAINING}-summary-tooltip`}
            />,
            readsLostData[READS_REMAINING].toLocaleString(),
          ],
        ],
        disabled: false,
      },
    ];

    this.setState({
      histogramTooltipData,
      tooltipClass: cs.summaryTooltip,
    });
  };

  handleSampleLabelEnter = sampleName => {
    const histogramTooltipData = [
      {
        name: "Info",
        data: [["Sample Name", sampleName]],
        disabled: false,
      },
    ];

    this.setState({
      histogramTooltipData,
    });
  };

  handleSampleLabelClick = sampleName => {
    const { validSamples, sidebarParams, sidebarVisible } = this.state;

    const sampleId = validSamples.find(sample => sample.name === sampleName).id;

    if (sampleId === sidebarParams.sampleId && sidebarVisible === true) {
      this.closeSidebar();
      return;
    }

    this.setState({
      sidebarVisible: true,
      sidebarParams: {
        sampleId: sampleId,
      },
    });
  };

  closeSidebar = () => {
    this.setState({
      sidebarVisible: false,
    });
  };

  hideprocessingSamplesMessage = () => {
    this.setState({ showProcessingSamplesMessage: false });
  };

  /* --- render functions --- */

  renderHistogram = (container, data, labelX, labelY, tickFormat) => {
    let histogram = new Histogram(container, data, {
      labelX: labelX,
      labelY: labelY,
      showStatistics: false,
      barOpacity: 1,
      colors: [BAR_FILL_COLOR],
      hoverColors: [HOVER_BAR_FILL_COLOR],
      clickColors: [BAR_CLICK_FILL_COLOR],
      hoverBuffer: 0,
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
      onHistogramBarHover: this.handleChartElementHover,
      onHistogramBarEnter: this.handleHistogramBarEnter,
      onHistogramBarExit: this.handleChartElementExit,
      onHistogramEmptyClick: this.handleHistogramEmptyClick,
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
    const { histogramTooltipData, tooltipLocation } = this.state;

    return (
      <div>
        {this.renderSampleStatsInfo()}
        <div className={cs.chartsContainer}>
          <div className={cs.halfPageChart}>
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
          <div className={cs.halfPageChart}>
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
          <div className={cs.halfPageChart}>
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
          <div className={cs.halfPageChart}>
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

  renderReadsLostChart() {
    const {
      readsLostData,
      readsLostCategories,
      readsLostChartColors,
      readsLostLegendColors,
    } = this.state;

    const options = {
      colors: readsLostChartColors,
      x: {
        pathVisible: false,
        ticksVisible: false,
        axisTitle: "Number of reads",
      },
      y: {
        pathVisible: false,
        ticksVisible: false,
      },
    };

    const events = {
      onYAxisLabelClick: this.handleSampleLabelClick,
      onYAxisLabelEnter: this.handleSampleLabelEnter,
      onBarStackEnter: this.handleSingleBarStackEnter,
      onBarEmptySpaceEnter: this.handleEmptyBarSpaceEnter,
      onChartHover: this.handleChartElementHover,
      onChartElementExit: this.handleChartElementExit,
    };

    return (
      <div className={cs.chartsContainer}>
        <div className={cs.fullPageChart}>
          <div className={cs.title}>
            How did my samples go through the pipeline?
          </div>
          <div className={cs.histogramContainer}>
            <div className={cs.subtitle}>
              Reads Lost
              <ColumnHeaderTooltip
                trigger={
                  <span>
                    <InfoIconSmall className={cs.infoIcon} />
                  </span>
                }
                title="Reads Lost"
                content={SAMPLE_TABLE_COLUMNS_V2.readsLost.tooltip}
                link={SAMPLE_TABLE_COLUMNS_V2.readsLost.link}
              />
            </div>
            <CategoricalLegend
              className={cs.legend}
              data={readsLostLegendColors}
            />
            <HorizontalStackedBarChart
              data={readsLostData}
              keys={readsLostCategories}
              options={options}
              events={events}
              yAxisKey={"name"}
              className={cs.stackedBarChart}
            />
          </div>
        </div>
      </div>
    );
  }

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
    const {
      loading,
      validSamples,
      sidebarVisible,
      sidebarParams,
      tooltipLocation,
      histogramTooltipData,
      tooltipClass,
    } = this.state;
    const showBlankState = !loading && validSamples.length === 0;

    if (showBlankState) {
      return this.renderBlankState();
    }

    return (
      <div className={cs.content}>
        {this.renderHistograms()}
        {this.renderReadsLostChart()}
        <DetailsSidebar
          visible={sidebarVisible}
          mode="sampleDetails"
          params={sidebarParams}
          onClose={this.closeSidebar}
        />
        {tooltipLocation && histogramTooltipData && (
          <div
            style={getTooltipStyle(tooltipLocation)}
            className={cx(cs.hoverTooltip, tooltipClass)}
          >
            <TooltipVizTable data={histogramTooltipData} />
          </div>
        )}
      </div>
    );
  }

  render() {
    const { loading } = this.state;
    // TODO(julie): fix resizing content when sidebars open/close
    return loading ? this.renderLoading() : this.renderVisualization();
  }
}

QualityControl.propTypes = {
  projectId: PropTypes.number,
  handleBarClick: PropTypes.func.isRequired,
  sampleStatsSidebarOpen: PropTypes.bool,
  filtersSidebarOpen: PropTypes.bool,
};

export default QualityControl;
