import { useQuery } from "@apollo/client";
import cx from "classnames";

import d3 from "d3";
import {
  ceil,
  compact,
  cloneDeep,
  debounce,
  flatten,
  get,
  isEqual,
  isInteger,
  last,
  max,
  sortBy,
} from "lodash/fp";
import memoize from "memoize-one";
import { nanoid } from "nanoid";
import React, { useEffect, useRef, useState } from "react";
import { trackEvent, ANALYTICS_EVENT_NAMES } from "~/api/analytics";
import { GET_SAMPLES_READS_STATS_QUERY } from "~/api/samples_reads_stats";
import DetailsSidebar from "~/components/common/DetailsSidebar/DetailsSidebar";
import List from "~/components/ui/List";
import ColumnHeaderTooltip from "~/components/ui/containers/ColumnHeaderTooltip";
import { IconInfoSmall } from "~/components/ui/icons";
import ImgVizSecondary from "~/components/ui/illustrations/ImgVizSecondary";
import PropTypes from "~/components/utils/propTypes";
import { getTooltipStyle } from "~/components/utils/tooltip";
import { WORKFLOWS } from "~/components/utils/workflows";
import { SAMPLE_TABLE_COLUMNS_V2 } from "~/components/views/samples/constants";
import Histogram from "~/components/visualizations/Histogram";
import BarChartToggle from "~/components/visualizations/bar_charts/BarChartToggle";
import HorizontalStackedBarChart from "~/components/visualizations/bar_charts/HorizontalStackedBarChart";
import CategoricalLegend from "~/components/visualizations/legends/CategoricalLegend";
import { numberWithPercent } from "~/helpers/strings";
import { apolloClient } from "~/index";
import { TooltipVizTable } from "~ui/containers";
import Notification from "~ui/notifications/Notification";
import InfoBanner from "./InfoBanner";
import { QUALITY_CONTROL_QUERY } from "./api/quality_control";
import {
  BAR_FILL_COLOR,
  HOVER_BAR_FILL_COLOR,
  BAR_CLICK_FILL_COLOR,
  READS_LOST_STACK_COLORS,
  READS_REMAINING_COLOR,
  READS_REMAINING,
  HUMAN_READABLE_STEP_NAMES,
  MIN_NUM_BINS,
  MIN_BIN_WIDTH,
  MISSING_INSERT_SIZE_WARNING,
} from "./constants";
import cs from "./quality_control.scss";

// TODO: get rid of this wrapper once the graphql
// conversion for getSamples and getSamplesReadStats
// is complete
function QualityControlWrapper(props) {
  const { loading, error, data } = useQuery(QUALITY_CONTROL_QUERY, {
    variables: {
      projectId: props.projectId,
      workflow: WORKFLOWS.SHORT_READ_MNGS.value,
      hostIds: props.filters.host,
      ...props.filters,
    },
  });
  if (loading) return <span>Loading...</span>;
  if (error) return <span>`Error! ${error.message}`</span>;

  return (
    <QualityControl
      project={data.project}
      samples={data.samplesList.samples}
      {...props}
    />
  );
}

function QualityControl({
  filters,
  project,
  projectId,
  samples,
  handleBarClick,
}) {
  const [loading, setLoading] = useState(true);
  const [
    showProcessingSamplesMessage,
    setShowProcessingSamplesMessage,
  ] = useState(true);
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [sidebarParams, setSidebarParams] = useState({ sampleId: null });
  const [histogramTooltipData, setHistogramTooltipData] = useState(null);
  const [normalize, setNormalize] = useState(false);
  const [failedSamples, setFailedSamples] = useState(null);
  const [readsLostData, setReadsLostData] = useState(null);
  const [readsLostLegendColors, setReadsLostLegendColors] = useState(null);
  const [readsLostCategories, setReadsLostCategories] = useState(null);
  const [readsLostChartColors, setReadsLostChartColors] = useState(null);
  const [totalSampleCount, setTotalSampleCount] = useState(null);
  const [samplesDict, setSamplesDict] = useState(null);
  const [tooltipLocation, setTooltipLocation] = useState(null);
  const [tooltipClass, setTooltipClass] = useState(null);
  const [validSamples, setValidSamples] = useState(null);
  const [runningSamples, setRunningSamples] = useState(null);
  const [meanInsertSizeHistogram, setMeanInsertSizeHistogram] = useState(null);

  const samplesByTotalReads = useRef([]);
  const samplesByQCPercent = useRef([]);
  const samplesByDCR = useRef([]);
  const samplesByInsertSize = useRef([]);
  const meanInsertSizeBins = useRef([]);
  const totalReadsBins = useRef([]);
  const dcrBins = useRef([]);
  const qcPercentBins = useRef([]);
  const totalReadsHistogramContainer = useRef(null);
  const qualityReadsHistogramContainer = useRef(null);
  const meanInsertSizeHistogramContainer = useRef(null);
  const dcrHistogramContainer = useRef(null);

  const filtersRef = useRef(filters);

  useEffect(() => {
    window.addEventListener("resize", handleWindowResize);
    return () => window.removeEventListener("resize", handleWindowResize);
  }, []);

  useEffect(() => {
    fetchProjectData();
  }, []);

  useEffect(() => {
    if (!isEqual(filters, filtersRef)) {
      filtersRef.current = filters;
      fetchProjectData().then(redrawHistograms);
    }
  }, [filters]);

  useEffect(() => {
    redrawHistograms();
  }, [loading]);

  const handleWindowResize = debounce(200, () => redrawHistograms());

  const redrawHistograms = () => {
    if (!loading && validSamples.length > 0) {
      const {
        totalReadsBins,
        qcPercentBins,
        dcrBins,
        meanInsertSizeBins,
      } = getBins();

      const totalReadsFormat = d => {
        if (d === 0) {
          return 0;
        } else {
          return d3.format(".2s")(d);
        }
      };
      renderHistogram({
        container: totalReadsHistogramContainer.current,
        data: totalReadsBins,
        labelX: "Total Reads",
        labelY: "Number of Samples",
        tickFormat: d => {
          return totalReadsFormat(d);
        },
      });

      renderHistogram({
        container: qualityReadsHistogramContainer.current,
        data: qcPercentBins,
        labelX: "Percentage",
        labelY: "Number of Samples",
        tickFormat: d => numberWithPercent(d),
      });

      renderHistogram({
        container: dcrHistogramContainer.current,
        data: dcrBins,
        labelX: "DCR",
        labelY: "Number of Samples",
      });
      if (meanInsertSizeBins.length > 0) {
        const _meanInsertSizeHistogram = renderHistogram({
          container: meanInsertSizeHistogramContainer.current,
          data: meanInsertSizeBins,
          labelX: "Base pairs",
          labelY: "Number of Samples",
        });
        setMeanInsertSizeHistogram(_meanInsertSizeHistogram);
      }
    }
  };

  const fetchProjectData = async () => {
    setLoading(true);
    let data = extractData(samples);
    const totalSampleCount =
      data.validSamples.length +
      data.runningSamples.length +
      data.failedSamples.length;

    const result = await apolloClient.query({
      query: GET_SAMPLES_READS_STATS_QUERY,
      variables: {
        sampleIds: data.validSamples.map(sample => sample.id),
      },
    });
    const samplesReadsStats = result.data.sampleReadsStats.sampleReadsStats;

    const { categories, legendColors, _readsLostData } = stackReadsLostData(
      samplesReadsStats,
    );
    const chartColors = legendColors.map(({ color, label }) => color);

    setValidSamples(data.validSamples);
    setRunningSamples(data.runningSamples);
    setFailedSamples(data.failedSamples);
    setSamplesDict(data.samplesDict);
    setReadsLostData(_readsLostData);
    setReadsLostLegendColors(legendColors);
    setReadsLostCategories(categories);
    setReadsLostChartColors(chartColors);
    setTotalSampleCount(totalSampleCount);
    setLoading(false);
  };

  function stackReadsLostData(samplesReadsStats) {
    samplesReadsStats = samplesReadsStats.reduce((result, item) => {
      result[item.sampleId] = cloneDeep(item);
      return result;
    }, {});
    const sampleIds = Object.keys(samplesReadsStats);
    const samplesWithInitialReads = sampleIds.filter(sampleId =>
      Number.isInteger(samplesReadsStats[sampleId].initialReads),
    );

    // Filter out Idseq Dedup step from samples run on pipeline versions >= 4.0
    samplesWithInitialReads.forEach(sampleId => {
      const sampleData = samplesReadsStats[sampleId];

      if (parseFloat(sampleData.pipelineVersion) >= 4) {
        sampleData.steps = sampleData.steps.filter(step => {
          // Cdhitdup required for backwards compatibility
          return (
            step.name !== "Idseq Dedup" &&
            step.name !== "Cdhitdup" &&
            step.name !== "Czid Dedup"
          );
        });
      }
    });

    // Collect all step names and humanize them
    const categories = samplesWithInitialReads.reduce((accum, sampleId) => {
      samplesReadsStats[sampleId].steps.forEach((step, index) => {
        step.name = HUMAN_READABLE_STEP_NAMES[step.name] || step.name;
        if (!accum.includes(step.name)) {
          accum.splice(index, 0, step.name);
        }
      });
      return accum;
    }, []);

    if (categories.length > 0) {
      categories.push(READS_REMAINING);
    }

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

    const _readsLostData = samplesWithInitialReads.map(sampleId => {
      const dataRow = {};
      let readsRemaining = samplesReadsStats[sampleId].initialReads;
      samplesReadsStats[sampleId].steps.forEach(step => {
        let readsAfter = step.readsAfter || readsRemaining;
        const readsLost = readsRemaining - readsAfter;
        dataRow[step.name] = readsLost;
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

    return { categories, legendColors, _readsLostData };
  }

  function extractData(samples) {
    const validSamples = [];
    const runningSamples = [];
    const failedSamples = [];
    const samplesDict = {};

    samples.forEach(sample => {
      // PLQC is only for samples with an mNGS pipeline run
      // The `created_at` field is only present+filled for a workflow run type
      // if the sample has a workflow run of that type, so we check if the sample
      // has `created_at` filled for mNGS.
      if (get("mngsRunInfo.createdAt", sample.details)) {
        const runInfo =
          get("uploadError", sample.details) ||
          get("mngsRunInfo", sample.details);
        if (
          runInfo.resultStatusDescription === "FAILED" ||
          runInfo.resultStatusDescription === "COMPLETE - ISSUE" ||
          runInfo.resultStatusDescription === "COMPLETE*"
        ) {
          failedSamples.push(sample);
        } else if (
          runInfo.reportReady &&
          sample.details.derivedSampleOutput.summaryStats
        ) {
          validSamples.push(sample);
          samplesDict[sample.id] = sample;
        } else {
          runningSamples.push(sample);
        }
      }
    });

    return {
      validSamples,
      runningSamples,
      failedSamples,
      samplesDict,
    };
  }

  const getBins = () => {
    const sortedReads = sortSamplesByMetric(sample => {
      return sample.details.derivedSampleOutput.pipelineRun.totalReads;
    });
    const [_totalReadsBins, _samplesByTotalReads] = extractBins({
      data: sortedReads,
      numBins: MIN_NUM_BINS,
      minBinWidth: MIN_BIN_WIDTH.totalReads,
    });

    const sortedQC = sortSamplesByMetric(sample => {
      return sample.details.derivedSampleOutput.summaryStats.qcPercent;
    });
    const [_qcPercentBins, _samplesByQCPercent] = extractBins({
      data: sortedQC,
      numBins: MIN_NUM_BINS,
      minBinWidth: MIN_BIN_WIDTH.qc,
    });

    const sortedDCR = sortSamplesByMetric(sample => {
      return sample.details.derivedSampleOutput.summaryStats.compressionRatio;
    });
    const [_dcrBins, _samplesByDCR] = extractBins({
      data: sortedDCR,
      numBins: MIN_NUM_BINS,
      minBinWidth: MIN_BIN_WIDTH.dcr,
    });

    const sortedInsertSize = sortSamplesByMetric(sample => {
      return sample.details.derivedSampleOutput.summaryStats.insertSizeMean;
    });
    const [_meanInsertSizeBins, _samplesByInsertSize] = extractBins({
      data: sortedInsertSize,
      numBins: MIN_NUM_BINS,
      minBinWidth: MIN_BIN_WIDTH.meanInsertSize,
    });

    samplesByTotalReads.current = _samplesByTotalReads;
    samplesByQCPercent.current = _samplesByQCPercent;
    samplesByDCR.current = _samplesByDCR;
    samplesByInsertSize.current = _samplesByInsertSize;
    totalReadsBins.current = _totalReadsBins;
    qcPercentBins.current = _qcPercentBins;
    dcrBins.current = _dcrBins;
    meanInsertSizeBins.current = _meanInsertSizeBins;

    return {
      totalReadsBins: _totalReadsBins,
      qcPercentBins: _qcPercentBins,
      dcrBins: _dcrBins,
      meanInsertSizeBins: _meanInsertSizeBins,
    };
  };

  const sortSamplesByMetric = fetchMetric => {
    const sampleIds = Object.keys(samplesDict);
    return sortBy(
      valuePair => valuePair.value,
      compact(
        sampleIds.map(sampleId => {
          if (fetchMetric(samplesDict[sampleId])) {
            return {
              id: sampleId,
              value: fetchMetric(samplesDict[sampleId]),
            };
          }
        }),
      ),
    );
  };

  const extractBins = ({ data, numBins, minBinWidth }) => {
    if (!data.length) {
      return [[], []];
    }
    // data is an array of {id, value} pairs, sorted by value
    const minVal = 0;
    const maxVal = ceil(
      max([last(data).value, minVal + numBins * minBinWidth]),
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

  /** callback functions **/

  const handleHistogramBarClick = (data, binIndex) => {
    let bin = [];
    if (data === totalReadsBins.current) {
      bin = samplesByTotalReads.current[binIndex];
    } else if (data === qcPercentBins.current) {
      bin = samplesByQCPercent.current[binIndex];
    } else if (data === dcrBins.current) {
      bin = samplesByDCR.current[binIndex];
    } else if (data === meanInsertSizeBins.current) {
      bin = samplesByInsertSize.current[binIndex];
    }
    trackEvent(ANALYTICS_EVENT_NAMES.QUALITY_CONTROL_HISTORGRAM_BAR_CLICKED, {
      bin,
    });
    handleBarClick(bin);
  };

  const handleHistogramBarEnter = (bin, data) => {
    let histogramTooltipData = null;
    if (data === totalReadsBins.current) {
      histogramTooltipData = getHistogramTooltipData({
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
    } else if (data === qcPercentBins.current) {
      histogramTooltipData = getHistogramTooltipData({
        bin: bin,
        label: "Passed QC",
        format: d => numberWithPercent(d),
      });
    } else if (data === dcrBins.current) {
      histogramTooltipData = getHistogramTooltipData({
        bin: bin,
        label: "Ratio Number",
      });
    } else if (data === meanInsertSizeBins.current) {
      histogramTooltipData = getHistogramTooltipData({
        bin: bin,
        label: "Base Pairs",
      });
    }

    trackEvent(ANALYTICS_EVENT_NAMES.QUALITY_CONTROL_HISTORGRAM_BAR_HOVEREED, {
      bin,
    });
    setHistogramTooltipData(histogramTooltipData);
  };

  const getHistogramTooltipData = memoize(({ bin, label, format }) => {
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

  const handleChartElementHover = (clientX, clientY) => {
    const tooltipLocation =
      clientX && clientY ? { left: clientX, top: clientY } : null;
    trackEvent(
      ANALYTICS_EVENT_NAMES.QUALITY_CONTROL_STACKED_BAR_CHART_BAR_HOVERED,
    );
    setTooltipLocation(tooltipLocation);
  };

  const handleChartElementExit = () => {
    setTooltipLocation(null);
    setTooltipClass(null);
    setHistogramTooltipData(null);
  };

  const handleHistogramEmptyClick = () => {
    trackEvent(
      ANALYTICS_EVENT_NAMES.QUALITY_CONTROL_HISTOGRAM_EMPTY_SPACE_CLICKED,
    );
    handleBarClick([]);
  };

  const handleSingleBarStackEnter = (stepName, readsLost) => {
    const stepLegend = readsLostLegendColors.find(
      legendData => legendData.label === stepName,
    );

    const readsLostStr = readsLost.toLocaleString();

    const histogramTooltipData = [
      {
        name: "Info",
        data: [
          [
            <CategoricalLegend
              className={cs.inlineLegend}
              data={[stepLegend]}
              key={nanoid()}
            />,
            normalize ? numberWithPercent(readsLostStr) : readsLostStr,
          ],
        ],
        disabled: false,
      },
    ];

    setHistogramTooltipData(histogramTooltipData);
  };

  const handleEmptyBarSpaceEnter = readsLostData => {
    const readsRemainingLegend = readsLostLegendColors.find(
      legendData => legendData.label === READS_REMAINING,
    );
    const readsLostSummary = [];
    readsLostCategories.forEach(category => {
      if (category === READS_REMAINING) {
        return;
      }
      const categoryLegend = readsLostLegendColors.find(
        legendData => legendData.label === category,
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
    setHistogramTooltipData(histogramTooltipData);
    setTooltipClass(cs.summaryTooltip);
  };

  const handleSampleLabelEnter = sampleName => {
    const histogramTooltipData = [
      {
        name: "Info",
        data: [["Sample Name", sampleName]],
        disabled: false,
      },
    ];

    trackEvent(
      ANALYTICS_EVENT_NAMES.QUALITY_CONTROL_STACKED_BAR_CHART_LABEL_HOVERED,
      {
        sampleName,
      },
    );
    setHistogramTooltipData(histogramTooltipData);
  };

  const handleSampleLabelClick = sampleName => {
    const sampleId = validSamples.find(sample => sample.name === sampleName).id;

    if (sampleId === sidebarParams.sampleId && sidebarVisible === true) {
      closeSidebar();
      return;
    }

    trackEvent(
      ANALYTICS_EVENT_NAMES.QUALITY_CONTROL_STACKED_BAR_CHART_LABEL_CLICKED,
      {
        sampleName,
      },
    );

    setSidebarVisible(true);
    setSidebarParams({ sampleId });
  };

  const closeSidebar = () => {
    setSidebarVisible(false);
  };

  const hideprocessingSamplesMessage = () => {
    setShowProcessingSamplesMessage(false);
  };

  /* --- render functions --- */

  const renderHistogram = ({ container, data, labelX, labelY, tickFormat }) => {
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
      labelYVerticalOffset: 22,
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
      onHistogramBarClick: handleHistogramBarClick,
      onHistogramBarHover: handleChartElementHover,
      onHistogramBarEnter: handleHistogramBarEnter,
      onHistogramBarExit: handleChartElementExit,
      onHistogramEmptyClick: handleHistogramEmptyClick,
    });
    histogram.update();
    return histogram;
  };

  function renderLoading() {
    return (
      <div className={cs.content}>
        <p className={cs.loadingIndicator}>
          <i className="fa fa-spinner fa-pulse fa-fw" />
          Loading...
        </p>
      </div>
    );
  }

  function renderHistograms() {
    const numSamplesWithInsertSize = meanInsertSizeHistogram
      ? flatten(samplesByInsertSize).length
      : 0;
    const showMeanInsertSizeWarning =
      meanInsertSizeHistogram && numSamplesWithInsertSize < validSamples.length;

    return (
      <div className={cs.histogramSection}>
        {renderSampleStatsInfo()}
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
                      <IconInfoSmall
                        className={cs.infoIcon}
                        onMouseOver={() => {
                          trackEvent(
                            ANALYTICS_EVENT_NAMES.QUALITY_CONTROL_TOTAL_READS_INFO_ICON_HOVERED,
                          );
                        }}
                      />
                    </span>
                  }
                  title="Total Reads"
                  content={SAMPLE_TABLE_COLUMNS_V2.totalReads.tooltip}
                  link={SAMPLE_TABLE_COLUMNS_V2.totalReads.link}
                />
              </div>
              <div
                className={cs.d3Container}
                ref={histogramContainer => {
                  totalReadsHistogramContainer.current = histogramContainer;
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
                      <IconInfoSmall
                        className={cs.infoIcon}
                        onMouseOver={() => {
                          trackEvent(
                            ANALYTICS_EVENT_NAMES.QUALITY_CONTROL_PASSED_QC_INFO_ICON_HOVERED,
                          );
                        }}
                      />
                    </span>
                  }
                  title="Passed QC"
                  content={SAMPLE_TABLE_COLUMNS_V2.qcPercent.tooltip}
                  link={SAMPLE_TABLE_COLUMNS_V2.qcPercent.link}
                />
              </div>
              <div
                className={cs.d3Container}
                ref={histogramContainer => {
                  qualityReadsHistogramContainer.current = histogramContainer;
                }}
              />
            </div>
          </div>
          <div className={cs.halfPageChart}>
            <div className={cs.title}>
              Are there too many duplicate reads in my library?
            </div>
            <div className={cs.histogramContainer}>
              <div className={cs.subtitle}>
                Duplicate Compression Ratio
                <ColumnHeaderTooltip
                  trigger={
                    <span>
                      <IconInfoSmall
                        className={cs.infoIcon}
                        onMouseOver={() => {
                          trackEvent(
                            ANALYTICS_EVENT_NAMES.QUALITY_CONTROL_DCR_INFO_ICON_HOVERED,
                          );
                        }}
                      />
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
                className={cs.d3Container}
                ref={histogramContainer => {
                  dcrHistogramContainer.current = histogramContainer;
                }}
              />
            </div>
          </div>
          <div className={cs.halfPageChart}>
            <div className={cs.title}>
              Do my samples have sufficient insert lengths?
            </div>
            <div className={cs.histogramContainer}>
              <div
                className={cx(
                  cs.subtitle,
                  showMeanInsertSizeWarning && cs.messageIncluded,
                )}
              >
                Mean Insert Size
                <ColumnHeaderTooltip
                  trigger={
                    <span>
                      <IconInfoSmall
                        className={cs.infoIcon}
                        onMouseOver={() => {
                          trackEvent(
                            ANALYTICS_EVENT_NAMES.QUALITY_CONTROL_MEAN_INSERT_SIZE_INFO_ICON_HOVERED,
                          );
                        }}
                      />
                    </span>
                  }
                  title="Mean Insert Size"
                  content={SAMPLE_TABLE_COLUMNS_V2.meanInsertSize.tooltip}
                  link={SAMPLE_TABLE_COLUMNS_V2.meanInsertSize.link}
                />
                {showMeanInsertSizeWarning && (
                  <div className={cs.message}>
                    Showing {numSamplesWithInsertSize} of {validSamples.length}{" "}
                    samples.
                    <ColumnHeaderTooltip
                      trigger={
                        <span>
                          <IconInfoSmall
                            className={cs.infoIcon}
                            onMouseOver={() => {
                              trackEvent(
                                ANALYTICS_EVENT_NAMES.QUALITY_CONTROL_MEAN_INSERT_SIZE_INFO_ICON_HOVERED,
                              );
                            }}
                          />
                        </span>
                      }
                      content={MISSING_INSERT_SIZE_WARNING}
                    />
                  </div>
                )}
                {!meanInsertSizeHistogram && (
                  <div className={cs.information}>
                    Mean Insert Size is not available.{" "}
                    {MISSING_INSERT_SIZE_WARNING}
                  </div>
                )}
              </div>
              <div
                className={cs.d3Container}
                ref={histogramContainer => {
                  meanInsertSizeHistogramContainer.current = histogramContainer;
                }}
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  function renderReadsLostChart() {
    const options = {
      colors: readsLostChartColors,
      x: {
        pathVisible: false,
        ticksVisible: false,
        axisTitle: "reads",
      },
      y: {
        pathVisible: false,
        ticksVisible: false,
      },
    };

    const events = {
      onYAxisLabelClick: handleSampleLabelClick,
      onYAxisLabelEnter: handleSampleLabelEnter,
      onBarStackEnter: handleSingleBarStackEnter,
      onBarEmptySpaceEnter: handleEmptyBarSpaceEnter,
      onChartHover: handleChartElementHover,
      onChartElementExit: handleChartElementExit,
    };

    return (
      <div className={cs.readsLostSection}>
        <div className={cs.chartsContainer}>
          <div className={cs.fullPageChart}>
            <div className={cs.title}>
              How were my samples processed through the pipeline?
            </div>
            <div className={cs.histogramContainer}>
              <div className={cs.toggleContainer}>
                <BarChartToggle
                  currentDisplay={normalize ? "percentage" : "count"}
                  onDisplaySwitch={display => {
                    setNormalize(i => !i);
                    trackEvent(
                      ANALYTICS_EVENT_NAMES.QUALITY_CONTROL_BAR_CHART_TOGGLE_CLICKED,
                      {
                        display,
                      },
                    );
                  }}
                />
              </div>
              <div className={cs.subtitle}>
                Reads Lost
                <ColumnHeaderTooltip
                  trigger={
                    <span>
                      <IconInfoSmall
                        className={cs.infoIcon}
                        onMouseOver={() => {
                          trackEvent(
                            ANALYTICS_EVENT_NAMES.QUALITY_CONTROL_STACKED_BAR_CHART_INFO_ICON_HOVERED,
                          );
                        }}
                      />
                    </span>
                  }
                  title="Reads Lost"
                  content={SAMPLE_TABLE_COLUMNS_V2.readsLost.tooltip}
                  link={SAMPLE_TABLE_COLUMNS_V2.readsLost.link}
                />
              </div>
              {readsLostCategories.length > 0 ? (
                <React.Fragment>
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
                    normalize={normalize}
                  />
                </React.Fragment>
              ) : (
                <div className={cs.noDataBannerFlexContainer}>
                  <InfoBanner
                    className={cs.noDataBannerContainer}
                    icon={<ImgVizSecondary />}
                    link={{
                      href: SAMPLE_TABLE_COLUMNS_V2.readsLost.link,
                      text: "Learn about sample QC",
                    }}
                    message="No reads lost data could be found for your samples."
                    title="Reads Lost Visualization"
                    type="no_reads_lost_step_data"
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const renderSampleStatsInfo = () => {
    const content = (
      <React.Fragment>
        <List
          listClassName={cs.statusList}
          listItems={[
            `${validSamples.length}
            ${validSamples.length === 1 ? "sample has" : "samples have"} been
            uploaded and selected by filters.`,
            `${runningSamples.length}
            ${runningSamples.length === 1 ? "sample is" : "samples are"} still
            being processed.`,
            `${failedSamples.length}
            ${failedSamples.length === 1 ? "sample" : "samples"} failed to
            process. Failed samples are not displayed in the charts below.`,
            `Samples with only Consensus Genome runs will not be displayed in the
            charts below`,
          ]}
        />
      </React.Fragment>
    );

    return (
      <div>
        {showProcessingSamplesMessage && runningSamples.length > 0 && (
          <Notification
            className={cx(
              cs.notification,
              showProcessingSamplesMessage ? cs.show : cs.hide,
            )}
            type="info"
            displayStyle="flat"
            onClose={hideprocessingSamplesMessage}
            closeWithDismiss={false}
            closeWithIcon={true}
          >
            {runningSamples.length}{" "}
            {runningSamples.length === 1 ? "sample is" : "samples are"} still
            being processed.
          </Notification>
        )}
        <span className={cs.statsRow}>
          Showing {validSamples.length} of {totalSampleCount} samples.
          <ColumnHeaderTooltip
            trigger={
              <span>
                <IconInfoSmall className={cs.infoIcon} />
              </span>
            }
            content={content}
          />
        </span>
      </div>
    );
  };

  function renderBlankState() {
    return (
      <div className={cs.noDataBannerFlexContainer}>
        <InfoBanner
          className={cs.noDataBannerContainer}
          icon={<ImgVizSecondary />}
          link={{
            href: "https://help.czid.org",
            text: "Learn about sample QC",
          }}
          message="You can visually check your QC metrics after your samples have successfully processed."
          title="Sample QC Visualizations"
          type="no_successful_samples"
        />
      </div>
    );
  }

  function renderVisualization() {
    const showBlankState = !loading && validSamples.length === 0;

    if (showBlankState) {
      return renderBlankState();
    }

    return (
      <div className={cs.content}>
        {renderHistograms()}
        {renderReadsLostChart()}
        <DetailsSidebar
          visible={sidebarVisible}
          mode="sampleDetails"
          params={sidebarParams}
          onClose={closeSidebar}
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
  return loading ? renderLoading() : renderVisualization();
}

QualityControlWrapper.propTypes = {
  filters: PropTypes.object,
  projectId: PropTypes.number,
  handleBarClick: PropTypes.func.isRequired,
  sampleStatsSidebarOpen: PropTypes.bool,
  filtersSidebarOpen: PropTypes.bool,
};

QualityControl.propTypes = {
  filters: PropTypes.object,
  projectId: PropTypes.number,
  handleBarClick: PropTypes.func.isRequired,
  sampleStatsSidebarOpen: PropTypes.bool,
  filtersSidebarOpen: PropTypes.bool,
  project: PropTypes.object,
};

export default QualityControlWrapper;
