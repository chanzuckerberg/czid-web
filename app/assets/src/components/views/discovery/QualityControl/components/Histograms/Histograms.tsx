import { Icon } from "@czi-sds/components";
import cx from "classnames";
import d3 from "d3";
import {
  ceil,
  compact,
  debounce,
  flatten,
  isEqual,
  isInteger,
  last,
  max,
  memoize,
  sortBy,
} from "lodash/fp";
import React, { useEffect, useRef, useState } from "react";
import { ANALYTICS_EVENT_NAMES, useTrackEvent } from "~/api/analytics";
import ColumnHeaderTooltip from "~/components/ui/containers/ColumnHeaderTooltip";
import { SHORT_READ_MNGS_SAMPLE_TABLE_COLUMNS } from "~/components/views/samples/constants";
import Histogram from "~/components/visualizations/Histogram";
import { numberWithPercent } from "~/helpers/strings";
import Sample from "~/interface/sample";
import {
  BAR_CLICK_FILL_COLOR,
  BAR_FILL_COLOR,
  HOVER_BAR_FILL_COLOR,
  MIN_BIN_WIDTH,
  MIN_NUM_BINS,
  MISSING_INSERT_SIZE_WARNING,
} from "../../../constants";
import cs from "./histograms.scss";

interface HistogramsProps {
  filters?: object;
  validSamples: Sample[];
  samplesDict: Record<string, Sample>;
  fetchProjectData: () => Promise<void>;
  handleBarClick: $TSFixMeFunction;
  handleChartElementHover: (clientX: number, clientY: number) => void;
  handleChartElementExit: () => void;
  setChartTooltipData: $TSFixMeFunction;
}

interface DataBin {
  x0: number;
  x1: number;
  length: number;
}

const NUMBER_OF_SAMPLES = "Number of Samples";

export const Histograms = ({
  filters,
  validSamples,
  samplesDict,
  fetchProjectData,
  handleBarClick,
  handleChartElementHover,
  handleChartElementExit,
  setChartTooltipData,
}: HistogramsProps) => {
  const trackEvent = useTrackEvent();

  const filtersRef = useRef(filters);
  const samplesByTotalReads = useRef<string[][]>([]);
  const samplesByQCPercent = useRef<string[][]>([]);
  const samplesByDCR = useRef<string[][]>([]);
  const samplesByInsertSize = useRef<string[][]>([]);
  const meanInsertSizeBins = useRef<DataBin[]>([]);
  const totalReadsBins = useRef<DataBin[]>([]);
  const dcrBins = useRef<DataBin[]>([]);
  const qcPercentBins = useRef<DataBin[]>([]);
  const totalReadsHistogramContainer = useRef<HTMLDivElement | null>(null);
  const qualityReadsHistogramContainer = useRef<HTMLDivElement | null>(null);
  const meanInsertSizeHistogramContainer = useRef<HTMLDivElement | null>(null);
  const dcrHistogramContainer = useRef<HTMLDivElement | null>(null);

  const [meanInsertSizeHistogram, setMeanInsertSizeHistogram] = useState(null);

  const numSamplesWithInsertSize = meanInsertSizeHistogram
    ? flatten(samplesByInsertSize.current).length
    : 0;
  const showMeanInsertSizeWarning =
    meanInsertSizeHistogram && numSamplesWithInsertSize < validSamples.length;

  useEffect(() => {
    window.addEventListener("resize", handleWindowResize);
    return () => window.removeEventListener("resize", handleWindowResize);
  }, []);

  useEffect(() => {
    if (!isEqual(filters, filtersRef)) {
      filtersRef.current = filters;
      fetchProjectData().then(redrawHistograms);
    }
  }, [filters]);

  const handleWindowResize = debounce(200, () => redrawHistograms());

  const redrawHistograms = () => {
    if (validSamples.length > 0) {
      const { totalReadsBins, qcPercentBins, dcrBins, meanInsertSizeBins } =
        getBins();

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
        labelY: NUMBER_OF_SAMPLES,
        tickFormat: d => {
          return totalReadsFormat(d);
        },
      });

      renderHistogram({
        container: qualityReadsHistogramContainer.current,
        data: qcPercentBins,
        labelX: "Percentage",
        labelY: NUMBER_OF_SAMPLES,
        tickFormat: (d: number) => numberWithPercent(d),
      });

      renderHistogram({
        container: dcrHistogramContainer.current,
        data: dcrBins,
        labelX: "DCR",
        labelY: NUMBER_OF_SAMPLES,
      });
      if (meanInsertSizeBins.length > 0) {
        const _meanInsertSizeHistogram = renderHistogram({
          container: meanInsertSizeHistogramContainer.current,
          data: meanInsertSizeBins,
          labelX: "Base pairs",
          labelY: NUMBER_OF_SAMPLES,
        });
        // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2345
        setMeanInsertSizeHistogram(_meanInsertSizeHistogram);
      }
    }
  };

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

  const extractBins = ({
    data,
    numBins,
    minBinWidth,
  }: {
    data: {
      id: string;
      value: any;
    }[];
    numBins: number;
    minBinWidth: number;
  }): [DataBin[], string[][]] => {
    if (!data.length) {
      return [[], []];
    }
    // data is an array of {id, value} pairs, sorted by value
    const minVal = 0;
    const maxVal = ceil(
      // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2532
      max([last(data).value, minVal + numBins * minBinWidth]),
    );
    let binWidth = (maxVal - minVal) / numBins;
    // if binWidth is not an integer, round it up to the next multiple of 0.5
    if (!isInteger(binWidth)) {
      binWidth = ceil(binWidth * 2) / 2;
    }

    const dataBins: DataBin[] = [];
    const sampleBins: string[][] = [];
    let x0 = minVal;
    let x1 = minVal + binWidth;
    let sampleIndex = 0;

    for (let i = 0; i < numBins; i++) {
      let binLength = 0;
      const sampleBin: string[] = [];
      while (sampleIndex < data.length) {
        const value = data[sampleIndex].value;
        const sampleId = data[sampleIndex].id;
        if (
          (x0 <= value && value < x1) ||
          (i === numBins - 1 && value === x1)
        ) {
          /* If the value falls within the bin, include it
             -OR-
             If this is the last bin and the value is equal to bin's upper limit,
             then include it in the last bin.
          */
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
    let bin: string[] = [];
    if (data === totalReadsBins.current) {
      bin = samplesByTotalReads.current[binIndex];
    } else if (data === qcPercentBins.current) {
      bin = samplesByQCPercent.current[binIndex];
    } else if (data === dcrBins.current) {
      bin = samplesByDCR.current[binIndex];
    } else if (data === meanInsertSizeBins.current) {
      bin = samplesByInsertSize.current[binIndex];
    }
    handleBarClick(bin);
  };

  const handleHistogramBarEnter = (bin, data) => {
    let histogramTooltipData = null;
    if (data === totalReadsBins.current) {
      // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2322
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
      // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2322
      histogramTooltipData = getHistogramTooltipData({
        bin: bin,
        label: "Passed QC",
        format: d => numberWithPercent(d),
      });
    } else if (data === dcrBins.current) {
      // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2322
      histogramTooltipData = getHistogramTooltipData({
        bin: bin,
        label: "Ratio Number",
      });
    } else if (data === meanInsertSizeBins.current) {
      // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2322
      histogramTooltipData = getHistogramTooltipData({
        bin: bin,
        label: "Base Pairs",
      });
    }
    setChartTooltipData(histogramTooltipData);
  };

  const handleHistogramEmptyClick = () => {
    trackEvent(
      ANALYTICS_EVENT_NAMES.QUALITY_CONTROL_HISTOGRAM_EMPTY_SPACE_CLICKED,
    );
    handleBarClick([]);
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

  /* --- render functions --- */

  const renderHistogram = ({
    container,
    data,
    labelX,
    labelY,
    tickFormat,
  }: {
    container;
    data: { x0: number; x1: number; length: number }[];
    labelX: string;
    labelY: string;
    tickFormat?: $TSFixMeFunction;
  }) => {
    const tickValues = data.map(d => d.x0);
    // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2532
    tickValues.push(last(data).x1);

    const histogram = new Histogram(container, data, {
      skipBins: true,
      // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2532
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

  return (
    <div className={cs.chartsContainer}>
      <div className={cs.halfPageChart}>
        <div data-testid="total-read-check" className={cs.title}>
          Do my samples have enough total reads?
        </div>
        <div className={cs.histogramContainer}>
          <div data-testid="total-read-title" className={cs.subtitle}>
            Total Reads
            <ColumnHeaderTooltip
              data-testid="total-read-tooltip"
              trigger={
                <span data-testid="total-read-info-icon">
                  <Icon
                    sdsIcon="infoCircle"
                    sdsSize="s"
                    sdsType="interactive"
                    className={cs.infoIcon}
                  />
                </span>
              }
              title="Total Reads"
              content={SHORT_READ_MNGS_SAMPLE_TABLE_COLUMNS.totalReads.tooltip}
              link={SHORT_READ_MNGS_SAMPLE_TABLE_COLUMNS.totalReads.link}
            />
          </div>
          <div
            data-testid="total-read-histogram"
            className={cs.d3Container}
            ref={histogramContainer => {
              totalReadsHistogramContainer.current = histogramContainer;
            }}
          />
        </div>
      </div>
      <div className={cs.halfPageChart}>
        <div data-testid="quality-read-check" className={cs.title}>
          Do my samples have enough quality reads?
        </div>
        <div className={cs.histogramContainer}>
          <div data-testid="passed-qc-title" className={cs.subtitle}>
            Passed QC
            <ColumnHeaderTooltip
              data-testid="passed-qc-tooltip"
              trigger={
                <span data-testid="passed-qc-info-icon">
                  <Icon
                    sdsIcon="infoCircle"
                    sdsSize="s"
                    sdsType="interactive"
                    className={cs.infoIcon}
                  />
                </span>
              }
              title="Passed QC"
              content={SHORT_READ_MNGS_SAMPLE_TABLE_COLUMNS.qcPercent.tooltip}
              link={SHORT_READ_MNGS_SAMPLE_TABLE_COLUMNS.qcPercent.link}
            />
          </div>
          <div
            data-testid="passed-qc-histogram"
            className={cs.d3Container}
            ref={histogramContainer => {
              qualityReadsHistogramContainer.current = histogramContainer;
            }}
          />
        </div>
      </div>
      <div className={cs.halfPageChart}>
        <div data-testid="duplicate-read-check" className={cs.title}>
          Are there too many duplicate reads in my library?
        </div>
        <div className={cs.histogramContainer}>
          <div
            data-testid="duplicate-compression-ratio-title"
            className={cs.subtitle}
          >
            Duplicate Compression Ratio
            <ColumnHeaderTooltip
              data-testid="duplicate-tooltip-info-icon"
              trigger={
                <span data-testid="duplicate-tooltip">
                  <Icon
                    sdsIcon="infoCircle"
                    sdsSize="s"
                    sdsType="interactive"
                    className={cs.infoIcon}
                  />
                </span>
              }
              title="DCR"
              content={
                SHORT_READ_MNGS_SAMPLE_TABLE_COLUMNS.duplicateCompressionRatio
                  .tooltip
              }
              link={
                SHORT_READ_MNGS_SAMPLE_TABLE_COLUMNS.duplicateCompressionRatio
                  .link
              }
            />
          </div>
          <div
            data-testid="duplicate-compression-histogram"
            className={cs.d3Container}
            ref={histogramContainer => {
              dcrHistogramContainer.current = histogramContainer;
            }}
          />
        </div>
      </div>
      <div className={cs.halfPageChart}>
        <div data-testid="sufficient-length-check" className={cs.title}>
          Do my samples have sufficient insert lengths?
        </div>
        <div className={cs.histogramContainer}>
          <div
            data-testid="mean-insert-size-title"
            className={cx(
              cs.subtitle,
              showMeanInsertSizeWarning && cs.messageIncluded,
            )}
          >
            Mean Insert Size
            <ColumnHeaderTooltip
              data-testid="mean-insert-size-info-icon"
              trigger={
                <span data-testid="mean-insert-size-tooltip">
                  <Icon
                    sdsIcon="infoCircle"
                    sdsSize="s"
                    sdsType="interactive"
                    className={cs.infoIcon}
                  />
                </span>
              }
              title="Mean Insert Size"
              content={
                SHORT_READ_MNGS_SAMPLE_TABLE_COLUMNS.meanInsertSize.tooltip
              }
              link={SHORT_READ_MNGS_SAMPLE_TABLE_COLUMNS.meanInsertSize.link}
            />
            {showMeanInsertSizeWarning && (
              <div className={cs.message}>
                Showing {numSamplesWithInsertSize} of {validSamples.length}{" "}
                samples.
                <ColumnHeaderTooltip
                  trigger={
                    <span>
                      <Icon
                        sdsIcon="infoCircle"
                        sdsSize="s"
                        sdsType="interactive"
                        className={cs.infoIcon}
                      />
                    </span>
                  }
                  content={MISSING_INSERT_SIZE_WARNING}
                />
              </div>
            )}
            {!meanInsertSizeHistogram && (
              <div className={cs.information}>
                Mean Insert Size is not available. {MISSING_INSERT_SIZE_WARNING}
              </div>
            )}
          </div>
          <div
            data-testid="mean-insert-size-histogram"
            className={cs.d3Container}
            ref={histogramContainer => {
              meanInsertSizeHistogramContainer.current = histogramContainer;
            }}
          />
        </div>
      </div>
    </div>
  );
};
