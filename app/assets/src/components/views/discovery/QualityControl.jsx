import React from "react";
import PropTypes from "~/components/utils/propTypes";
import cx from "classnames";

import d3 from "d3";
import memoize from "memoize-one";
import { getSamples, getSamplesReadStats } from "~/api";
import { ceil, isInteger, last, max, sortBy } from "lodash/fp";
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
  MIN_NUM_BINS,
  MIN_BIN_WIDTH,
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
    const { loading, validSamples } = this.state;

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
      const {
        totalReadsBins,
        qcPercentBins,
        dcrBins,
        meanInsertSizeBins,
      } = this.getBins();

      const totalReadsFormat = d => {
        if (d === 0) {
          return 0;
        } else {
          return d3.format(".2s")(d);
        }
      };
      this.totalReadsHistogram = this.renderHistogram({
        container: this.totalReadsHistogramContainer,
        data: totalReadsBins,
        labelX: "Total Reads",
        labelY: "Number of Samples",
        tickFormat: d => {
          return totalReadsFormat(d);
        },
      });
      this.qualityReadsHistogram = this.renderHistogram({
        container: this.qualityReadsHistogramContainer,
        data: qcPercentBins,
        labelX: "Percentage",
        labelY: "Number of Samples",
        tickFormat: d => {
          return d + "%";
        },
      });
      this.dcrHistogram = this.renderHistogram({
        container: this.dcrHistogramContainer,
        data: dcrBins,
        labelX: "DCR",
        labelY: "Number of Samples",
      });
      this.meanInsertSizeHistogram = this.renderHistogram({
        container: this.meanInsertSizeHistogramContainer,
        data: meanInsertSizeBins,
        labelX: "Base pairs",
        labelY: "Number of Samples",
      });
    }
  }

  fetchProjectData = async () => {
    const { projectId } = this.props;

    const projectSamples = await getSamples({
      projectId: projectId,
    });

    let data = this.extractData(projectSamples.samples);

    const samplesReadsStats = await getSamplesReadStats(
      data.validSamples.map(sample => sample.id)
    );
    const { categories, legendColors, readsLostData } = this.stackReadsLostData(
      samplesReadsStats
    );
    const chartColors = legendColors.map(({ color, label }) => color);

    this.setState({
      loading: false,
      samples: projectSamples.samples,
      validSamples: data.validSamples,
      runningSamples: data.runningSamples,
      failedSamples: data.failedSamples,
      samplesDict: data.samplesDict,
      readsLostData: readsLostData,
      readsLostLegendColors: legendColors,
      readsLostCategories: categories,
      readsLostChartColors: chartColors,
    });
  };

  stackReadsLostData(samplesReadsStats) {
    const sampleIds = Object.keys(samplesReadsStats);

    // Collect all step names and humanize them
    const categories = sampleIds.reduce((accum, sampleId) => {
      samplesReadsStats[sampleId].steps.forEach((step, index) => {
        step.name = HUMAN_READABLE_STEP_NAMES[step.name] || step.name;
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

    const readsLostData = sampleIds.map(sampleId => {
      const dataRow = {};
      let readsRemaining = samplesReadsStats[sampleId].initialReads;
      let total = 0;
      samplesReadsStats[sampleId].steps.forEach(step => {
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
      dataRow.total = samplesReadsStats[sampleId].initialReads;
      dataRow.name = samplesReadsStats[sampleId].name;
      dataRow[READS_REMAINING] = readsRemaining;

      return dataRow;
    });

    return { categories, legendColors, readsLostData };
  }

  extractData(samples) {
    const validSamples = [];
    const runningSamples = [];
    const failedSamples = [];
    const samplesDict = {};

    samples.forEach(sample => {
      const runInfo = sample.details.run_info;

      if (
        runInfo.result_status_description === "FAILED" ||
        runInfo.result_status_description === "COMPLETE - ISSUE" ||
        runInfo.result_status_description === "COMPLETE*"
      ) {
        failedSamples.push(sample);
      } else if (runInfo.report_ready) {
        validSamples.push(sample);
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
    };
  }

  getBins = () => {
    const sortedReads = this.sortSamplesByMetric(sample => {
      return sample.details.derived_sample_output.pipeline_run.total_reads;
    });
    const [totalReadsBins, samplesByTotalReads] = this.extractBins({
      data: sortedReads,
      numBins: MIN_NUM_BINS,
      minBinWidth: MIN_BIN_WIDTH.totalReads,
    });

    const sortedQC = this.sortSamplesByMetric(sample => {
      return sample.details.derived_sample_output.summary_stats.qc_percent;
    });
    const [qcPercentBins, samplesByQCPercent] = this.extractBins({
      data: sortedQC,
      numBins: MIN_NUM_BINS,
      minBinWidth: MIN_BIN_WIDTH.qc,
    });

    const sortedDCR = this.sortSamplesByMetric(sample => {
      return sample.details.derived_sample_output.summary_stats
        .compression_ratio;
    });
    const [dcrBins, samplesByDCR] = this.extractBins({
      data: sortedDCR,
      numBins: MIN_NUM_BINS,
      minBinWidth: MIN_BIN_WIDTH.dcr,
    });

    const sortedInsertSize = this.sortSamplesByMetric(sample => {
      return (
        sample.details.derived_sample_output.summary_stats.insert_size_mean || 0
      );
    });
    const [meanInsertSizeBins, samplesByInsertSize] = this.extractBins({
      data: sortedInsertSize,
      numBins: MIN_NUM_BINS,
      minBinWidth: MIN_BIN_WIDTH.meanInsertSize,
    });

    this.setState({
      totalReadsBins,
      samplesByTotalReads,
      qcPercentBins,
      samplesByQCPercent,
      dcrBins,
      samplesByDCR,
      meanInsertSizeBins,
      samplesByInsertSize,
    });

    return {
      totalReadsBins,
      qcPercentBins,
      dcrBins,
      meanInsertSizeBins,
    };
  };

  sortSamplesByMetric = fetchMetric => {
    const { samplesDict } = this.state;
    const sampleIds = Object.keys(samplesDict);
    return sortBy(
      valuePair => valuePair.value,
      sampleIds.map(sampleId => ({
        id: sampleId,
        value: fetchMetric(samplesDict[sampleId]),
      }))
    );
  };

  extractBins = ({ data, numBins, minBinWidth }) => {
    // data is an array of {id, value} pairs, sorted by value
    const minVal = 0;
    const maxVal = ceil(
      max([last(data).value, minVal + numBins * minBinWidth])
    );
    let binWidth = (maxVal - minVal) / numBins;
    // if binWidth is not an integer, round it up to the next multiple of 0.5
    if (!isInteger(binWidth)) {
      binWidth = ceil(binWidth * 2) / 2;
    }

    const dataBins = [];
    const sampleBins = [];
    let x0 = minVal;
    let x1 = minVal + binWidth;
    let sampleIndex = 0;

    for (let i = 0; i < numBins; i++) {
      let binLength = 0;
      const sampleBin = [];
      while (sampleIndex < data.length) {
        const value = data[sampleIndex].value;
        const sampleId = data[sampleIndex].id;
        if (x0 <= value && value < x1) {
          sampleBin.push(sampleId);
          binLength++;
          sampleIndex++;
        } else if (i === numBins - 1 && value === x1) {
          // If this is the last bin and the value is equal to bin's upper limit,
          // then include it in the last bin.
          sampleBin.push(sampleId);
          binLength++;
          sampleIndex++;
        } else {
          break;
        }
      }
      sampleBins.push(sampleBin);
      dataBins.push({
        x0: x0,
        x1: x1,
        length: binLength,
      });
      x0 = x1;
      x1 = x1 + binWidth;
    }

    return [dataBins, sampleBins];
  };

  handleHistogramBarClick = (data, binIndex) => {
    const {
      totalReadsBins,
      samplesByTotalReads,
      qcPercentBins,
      samplesByQCPercent,
      dcrBins,
      samplesByDCR,
      meanInsertSizeBins,
      samplesByInsertSize,
    } = this.state;
    const { handleBarClick } = this.props;

    let bin = [];
    if (data === totalReadsBins) {
      bin = samplesByTotalReads[binIndex];
    } else if (data === qcPercentBins) {
      bin = samplesByQCPercent[binIndex];
    } else if (data === dcrBins) {
      bin = samplesByDCR[binIndex];
    } else if (data === meanInsertSizeBins) {
      bin = samplesByInsertSize[binIndex];
    }
    handleBarClick(bin);
  };

  handleHistogramBarEnter = (bin, data) => {
    const {
      totalReadsBins,
      qcPercentBins,
      dcrBins,
      meanInsertSizeBins,
    } = this.state;

    let histogramTooltipData = {};
    if (data === totalReadsBins) {
      histogramTooltipData = this.getHistogramTooltipData({
        bin: bin,
        label: "Total Reads",
        format: d => {
          if (d === 0) {
            return 0;
          } else {
            return d3.format(".2s")(d);
          }
        },
      });
    } else if (data === qcPercentBins) {
      histogramTooltipData = this.getHistogramTooltipData({
        bin: bin,
        label: "Passed QC",
        format: d => {
          return d + "%";
        },
      });
    } else if (data === dcrBins) {
      histogramTooltipData = this.getHistogramTooltipData({
        bin: bin,
        label: "Ratio Number",
      });
    } else if (data === meanInsertSizeBins) {
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

  renderHistogram = ({ container, data, labelX, labelY, tickFormat }) => {
    const tickValues = data.map(d => d.x0);
    tickValues.push(last(data).x1);

    let histogram = new Histogram(container, data, {
      skipBins: true,
      domain: [0, last(data).x1],
      tickValues: tickValues,
      labelX: labelX,
      labelY: labelY,
      labelsLarge: true,
      labelYHorizontalOffset: 4,
      labelYVerticalOffset: 122,
      labelXVerticalOffset: 4,
      yTickFilter: isInteger,
      yTickFormat: d3.format(""),
      showGridlines: true,
      xTickFormat: tickFormat,
      showStatistics: false,
      spacedBars: true,
      barOpacity: 1,
      colors: [BAR_FILL_COLOR],
      hoverColors: [HOVER_BAR_FILL_COLOR],
      clickColors: [BAR_CLICK_FILL_COLOR],
      hoverBuffer: 0,
      simple: true,
      margins: {
        top: 10,
        right: 15,
        bottom: 40,
        left: 40,
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
