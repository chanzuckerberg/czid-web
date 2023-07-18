import cx from "classnames";
import { max } from "d3-array";
import { scaleBand, scaleLinear, scaleOrdinal } from "d3-scale";
import { stack } from "d3-shape";
import { maxBy, round } from "lodash";
import React from "react";
import { normalizeData } from "~/components/visualizations/utils";
import { numberWithPercent, numberWithSiPrefix } from "~/helpers/strings";
import cs from "./horizontal_stacked_bar_chart.scss";
import XAxis from "./XAxis";
import YAxis from "./YAxis";

// Data passed into this chart should be an array of objects in the form:
// [
//  ...
//  { yAxisKey: yValue1, dataKey1: value1, dataKey2: value2, total: value1 + value2 },
//  { yAxisKey: yValue2, dataKey1: value2, dataKey2: value3, total: value3 + value4 },
//  ...
// ]
// an example object:
// { item: "Donuts", MondaySales: 10, TuesdaySales: 7, total: 17 }

// We don't want labels on the Y-axis to take up any more than 30% of the width of the chart.
const MAX_Y_AXIS_AREA_RATIO = 0.3;

// This object shows all the settings you can pass into the options object.
// These are used as defaults.
const defaults = {
  canvasClassName: null,
  colors: [
    "#AABDFC",
    "#DF87B0",
    "#88D0CA",
    "#2C8CB5",
    "#E58740",
    "#D43A81",
    "#55C567",
    "#1E968B",
    "#693BAC",
  ],
  sort: null,
  x: {
    pathVisible: true,
    ticksVisible: true,
    gridVisible: true,
    tickSize: 6,
    tickSpacing: 45,
    axisTitle: null,
    axisTitleClassName: null,
    gridClassName: null,
    textClassName: null,
  },
  y: {
    pathVisible: true,
    ticksVisible: true,
    tickSize: 6,
    textClassName: null,
  },
  bars: {
    height: 22,
    padding: 6,
    strokeWidth: 2,
    stackPieceClassName: null,
    fullBarClassName: null,
    emptySpaceClassName: null,
  },
};

interface HorizontalStackedBarChartProps {
  data?: $TSFixMeUnknown[];
  keys?: string[];
  options?: { colors?; x; y };
  events?: {
    onYAxisLabelClick?: $TSFixMeFunction;
    onYAxisLabelEnter?: $TSFixMeFunction;
    onBarStackEnter?: $TSFixMeFunction;
    onBarEmptySpaceEnter?: $TSFixMeFunction;
    onChartHover?: $TSFixMeFunction;
    onChartElementExit?: $TSFixMeFunction;
  };
  yAxisKey?: string;
  className?: string;
  normalize?: boolean;
}

interface HorizontalStackedBarChartState {
  data: $TSFixMeUnknown[];
  options: {
    canvasClassName?: string;
    y?;
    x?: {
      gridClassName: string;
      axisTitleClassName: string;
      axisTitle: string;
      tickSpacing: number;
      gridVisible: boolean;
      tickSize: number;
      ticksVisible: boolean;
      pathVisible: boolean;
      textClassName: string;
    };
    bars?: {
      emptySpaceClassName?: string;
      fullBarClassName?: string;
      stackPieceClassName?: string;
      strokeWidth: number;
      height: number;
      padding: number;
    };
    colors?: string[];
  };
  stackedData: [number, number][][];
  keys: $TSFixMeUnknown;
  dataKeys: $TSFixMeUnknown[];
  mouseOverBar: $TSFixMeUnknown;
  measurements: {
    xTextHeight?;
    xTextWidth?;
    yTextWidthPairs?;
    wideGlyphTextWidth?;
    ellipsisTextWidth?;
  };
  redrawNeeded: boolean;
  barHeight?: number;
  x?;
  y?: (...args: $TSFixMeUnknown[]) => number;
  z?: (...args: $TSFixMeUnknown[]) => string;
  width?: number;
  labels?: string[];
  xAxisHeight?: number;
  barCanvasHeight?: number;
  barCanvasWidth?: number;
  yAxisWidth?: number;
}

export default class HorizontalStackedBarChart extends React.Component<
  HorizontalStackedBarChartProps,
  HorizontalStackedBarChartState
> {
  data: $TSFixMe;
  normalizedData: $TSFixMe;
  references: $TSFixMe;
  stackGenerator: $TSFixMe;
  constructor(props: HorizontalStackedBarChartProps) {
    super(props);

    const { data, keys, options, yAxisKey, normalize } = props;

    const mergedOptions = this.mergeOptionsWithDefaults(defaults, options);

    // Pre-process raw and normalized data
    this.data = data;
    this.normalizedData = normalizeData(data, keys);

    // @ts-expect-error ts-migrate(2339) FIXME: Property 'sort' does not exist on type '{}'.
    const sortedMergedOptions = mergedOptions.sort;
    if (sortedMergedOptions) {
      this.data.sort(sortedMergedOptions);
      this.normalizedData.sort(sortedMergedOptions);
    }

    const stateData = normalize ? this.normalizedData : this.data;

    // Create stack generator
    const dataKeys = keys.filter((key: $TSFixMe) => key !== yAxisKey);
    this.stackGenerator = stack().keys(dataKeys);

    this.state = {
      data: stateData,
      options: mergedOptions,
      stackedData: this.stackGenerator(stateData),
      keys,
      dataKeys,
      mouseOverBar: null,
      measurements: {},
      redrawNeeded: true,
    };

    this.references = {
      xRef: null,
      yRef: [],
      wRef: null,
      ellipsis: null,
      container: null,
    };
  }

  componentDidMount() {
    this.updateClientMeasurements();
    window.addEventListener("resize", this.handleWindowResize);
  }

  componentDidUpdate(prevProps: HorizontalStackedBarChartProps) {
    const { redrawNeeded } = this.state;
    const scaleChanged = this.props.normalize !== prevProps.normalize;
    if (redrawNeeded || scaleChanged) {
      this.updateChartDimensions();
      this.setState({ redrawNeeded: false });
    }
  }

  componentWillUnmount() {
    window.removeEventListener("resize", this.handleWindowResize);
  }

  /* --- pre-mount functions --- */

  mergeOptionsWithDefaults(defaults: $TSFixMe, options: $TSFixMe) {
    const mergedOptions = {};
    const valueOptionKeys = ["canvasClassName", "colors", "sort"];
    valueOptionKeys.forEach(option => {
      mergedOptions[option] = options[option] || defaults[option];
    });

    const referenceOptionKeys = ["x", "y", "bars", "margin"];
    referenceOptionKeys.forEach(option => {
      mergedOptions[option] = {
        ...defaults[option],
        ...options[option],
      };
    });
    return mergedOptions;
  }

  /* --- mount functions --- */

  updateClientMeasurements() {
    const { xTextHeight, xTextWidth } = this.measureXAxisText();
    const yTextWidthPairs = this.measureYAxisText();
    const wideGlyphTextWidth = this.references.wRef.clientWidth;
    const ellipsisTextWidth = this.references.ellipsis.clientWidth;

    this.setState({
      measurements: {
        xTextHeight,
        xTextWidth,
        yTextWidthPairs,
        wideGlyphTextWidth,
        ellipsisTextWidth,
      },
    });
  }

  /* --- post-mount functions --- */

  updateChartDimensions() {
    const { yAxisKey, normalize } = this.props;
    const { dataKeys } = this.state;
    const stateData = normalize ? this.normalizedData : this.data;

    // allow for autoselection of width
    // 98% container width to account for floating point math rounding
    // and variation among browsers and operating systems
    const width = this.references.container.clientWidth * 0.98;

    const { barCanvasHeight, xAxisHeight } = this.measureHeights();
    const { barCanvasWidth, yAxisWidth, truncatedLabels } =
      this.measureWidths(width);

    const { x, y, z } = this.createDimensions(barCanvasWidth, barCanvasHeight);

    y.domain(
      stateData.map((d: $TSFixMe) => {
        return d[yAxisKey];
      }),
    );

    const xDomainMax = max(stateData, (d: $TSFixMe) => d.total);
    if (normalize) {
      x.domain([0, xDomainMax]);
    } else {
      // Leave extra space to render invisible bar
      x.domain([0, xDomainMax * 1.1]).nice();
    }

    z.domain(dataKeys);

    const labels = truncatedLabels.length > 0 ? truncatedLabels : y.domain();

    this.setState({
      data: stateData,
      stackedData: this.stackGenerator(stateData),
      xAxisHeight,
      barCanvasHeight,
      barCanvasWidth,
      yAxisWidth,
      labels,
      barHeight: y.bandwidth(),
      x,
      y,
      z,
      width,
    });
  }

  measureHeights() {
    const { data, options, measurements } = this.state;

    const xAxisHeight =
      options.x.tickSize *
        Number(options.x.ticksVisible || options.x.pathVisible) +
      measurements.xTextHeight;
    const barCanvasHeight =
      data.length * (options.bars.height + options.bars.padding);

    return { barCanvasHeight, xAxisHeight };
  }

  measureWidths(width: $TSFixMe) {
    const { measurements } = this.state;

    const truncatedLabels: $TSFixMe = [];
    const longestLabel = maxBy(measurements.yTextWidthPairs, pair => pair[1]);
    const longestLabelLength = longestLabel[1];

    // Since x-axis labels are centered on their tick mark, we need to make sure
    // the last tick mark appears before the right end of the canvas with enough
    // space for the label
    const canvasWidth = width - measurements.xTextWidth;
    let yAxisWidth = Math.min(
      longestLabelLength,
      canvasWidth * MAX_Y_AXIS_AREA_RATIO,
    );

    if (longestLabelLength > yAxisWidth) {
      measurements.yTextWidthPairs.forEach((pair: $TSFixMe) => {
        const [label, labelWidth] = pair;

        let modifiedLabel = label;

        if (labelWidth > yAxisWidth) {
          const lengthToTruncate = Math.ceil(
            (labelWidth - (yAxisWidth + measurements.ellipsisTextWidth)) /
              measurements.wideGlyphTextWidth,
          );
          const truncatedLabelSliceIndex = label.length - lengthToTruncate - 1;
          modifiedLabel = label.slice(0, truncatedLabelSliceIndex) + "...";
        }

        truncatedLabels.push(modifiedLabel);
      });
    }

    const barCanvasWidth = canvasWidth - yAxisWidth;
    // properly translate the canvas to the right
    yAxisWidth = yAxisWidth + measurements.xTextWidth / 2;

    return { barCanvasWidth, yAxisWidth, truncatedLabels };
  }

  createDimensions(barCanvasWidth: $TSFixMe, barCanvasHeight: $TSFixMe) {
    const { options } = this.state;

    const paddingScalar = options.bars.padding / options.bars.height;

    const x = scaleLinear().range([0, barCanvasWidth]);
    const y = scaleBand()
      .range([0, barCanvasHeight])
      .paddingInner(paddingScalar)
      .paddingOuter(paddingScalar / 4);
    const z = scaleOrdinal().range(options.colors);

    return { x, y, z };
  }

  /* --- measure baseline text dimensions from client rendering --- */

  renderAxisBaselines() {
    const { yAxisKey } = this.props;
    const { data, options } = this.state;

    const elements = data.map((datum: $TSFixMe) => {
      const yAttribute = datum[yAxisKey];
      return (
        <div
          className={cx(cs.test, options.y.textClassName, cs.yAxisText)}
          key={yAttribute}
          ref={ref => {
            const refLocation = this.references.yRef.findIndex(
              (ref: $TSFixMe) => ref[0] === yAttribute,
            );
            if (refLocation >= 0 && ref !== null) {
              this.references.yRef[refLocation][1] = ref;
            } else if (ref !== null) {
              this.references.yRef.push([yAttribute, ref]);
            }
          }}
        >
          {yAttribute}
        </div>
      );
    });

    // measure how wide the glyph "W" is, since this is
    // almost always the widest glyph, and also
    // measure how wide an ellipsis is, because we need to
    // truncate text shorter than the width of the y-axis
    // area to add ellipses at the end.
    elements.push(
      <div
        className={cx(cs.test, options.y.textClassName, cs.yAxisText)}
        key={"W"}
        ref={ref => {
          this.references.wRef = ref;
        }}
      >
        {"W"}
      </div>,
      <div
        className={cx(cs.test, options.x.textClassName, cs.xAxisText)}
        key={"x-axis-text"}
        ref={ref => {
          this.references.xRef = ref;
        }}
      >
        {"999M" /* for the x-axis */}
      </div>,
      <div
        className={cx(cs.test, options.y.textClassName, cs.yAxisText)}
        key={"ellipsis"}
        ref={ref => {
          this.references.ellipsis = ref;
        }}
      >
        {"..."}
      </div>,
    );

    return elements;
  }

  measureXAxisText() {
    return {
      xTextHeight: this.references.xRef.clientHeight,
      xTextWidth: this.references.xRef.clientWidth,
    };
  }

  measureYAxisText() {
    const yAxisRefs = this.references.yRef.filter(
      (refPair: $TSFixMe) => refPair[1] !== null,
    );
    return yAxisRefs.map((keyRefPair: $TSFixMe) => [
      keyRefPair[0],
      keyRefPair[1].clientWidth,
    ]);
  }

  /* --- callbacks --- */

  handleYAxisLabelClick = (yAttribute: $TSFixMe, index: $TSFixMe) => {
    const { events } = this.props;
    const { data } = this.state;

    events.onYAxisLabelClick(yAttribute, data[index]);
  };

  handleYAxisLabelEnter = (yAttribute: $TSFixMe, index: $TSFixMe) => {
    const { events } = this.props;
    const { data } = this.state;

    events.onYAxisLabelEnter(yAttribute, data[index]);
  };

  handleWindowResize = () => {
    this.setState({ redrawNeeded: true });
  };

  /* --- rendering --- */

  renderVisibleStackedBars() {
    const { events, normalize, yAxisKey } = this.props;
    const {
      options,
      data,
      dataKeys,
      stackedData,
      barHeight,
      mouseOverBar,
      x,
      y,
      z,
    } = this.state;

    const strokeWidth = normalize ? 0 : options.bars.strokeWidth;

    const coloredBars = dataKeys.map((key: $TSFixMe, keyIndex: $TSFixMe) => {
      const color = z(key);
      const colorStackComponent = stackedData[keyIndex].map(
        (stackPieceRange: $TSFixMe, stackIndex: $TSFixMe) => {
          const yAttribute = data[stackIndex][yAxisKey];
          const xLeft = stackPieceRange[0];
          const xRight = stackPieceRange[1];
          const yPosition = y(yAttribute);
          const xPosition = x(xLeft);
          let width = x(xRight - xLeft) - strokeWidth;

          // keep bars at least 1 pixel wide so they're visible
          if (width < 1) {
            width = 1;
          }

          const valueForStackPiece = data[stackIndex][key];

          const visibility =
            mouseOverBar && mouseOverBar !== yAttribute
              ? cs.faded
              : cs.barPiece;

          return (
            <g key={`${yAttribute}+${key}`}>
              <rect
                y={yPosition}
                x={xPosition}
                width={width}
                height={barHeight}
                key={`${yAttribute}+${keyIndex}`}
                className={cx(options.bars.stackPieceClassName, visibility)}
                onMouseEnter={() =>
                  events.onBarStackEnter(key, valueForStackPiece)
                }
                onMouseLeave={() => events.onChartElementExit()}
              />
            </g>
          );
        },
      );
      return (
        <g
          fill={color}
          stroke={color}
          strokeWidth={strokeWidth}
          key={`${color}+${keyIndex}`}
        >
          {colorStackComponent}
        </g>
      );
    });

    return <g key={"visibleStack"}>{coloredBars}</g>;
  }

  renderInvisibleStackedBars() {
    const { events, normalize, yAxisKey } = this.props;
    const {
      data,
      options,
      stackedData,
      barCanvasWidth,
      barHeight,
      mouseOverBar,
      x,
      y,
    } = this.state;

    if (normalize) return null;

    // Insert a last, transparent bar component for each y-item stack; fill-opacity = 0
    // consists of a stack of two bars; one covers the visible bar, the other the empty space
    // These invisible stack components allows for a function to be passed as a prop to this
    // component that fires when a user's cursor hovers over the empty space to the right
    // of the bar. It also allows for the whole bar to be selected (e.g. via css) instead of
    // just pieces of the stack.
    const invisibleStackComponents = stackedData[stackedData.length - 1].map(
      (stackPieceRange: $TSFixMe, stackIndex: $TSFixMe) => {
        const yAttribute = data[stackIndex][yAxisKey];
        const xLeft = 0;
        const xMid = stackPieceRange[1];
        const xRight = barCanvasWidth;
        const yPosition = y(yAttribute);

        const fullXPosition = x(xLeft);
        const emptyXPosition = x(xMid);

        let fullWidth = x(xMid - xLeft) - options.bars.strokeWidth;
        if (fullWidth < 1) {
          fullWidth = 1;
        }

        let emptyWidth = xRight - x(xMid);
        if (emptyWidth < 1) {
          emptyWidth = 1;
        }

        const dataForStack = data[stackIndex];

        return (
          <g key={`${yAttribute}+invisiblebars`}>
            <rect
              y={yPosition}
              x={emptyXPosition}
              width={emptyWidth}
              height={barHeight}
              key={`${yAttribute}+emptybar`}
              className={cx(options.bars.emptySpaceClassName, cs.emptyBarSpace)}
              onMouseEnter={() =>
                this.setState(
                  { mouseOverBar: yAttribute },
                  // @ts-expect-error ts-migrate(2532) FIXME: Object is possibly 'undefined'.
                  events.onBarEmptySpaceEnter(dataForStack),
                )
              }
              onMouseLeave={() =>
                this.setState(
                  { mouseOverBar: null },
                  // @ts-expect-error ts-migrate(2532) FIXME: Object is possibly 'undefined'.
                  events.onChartElementExit(),
                )
              }
            />
            {mouseOverBar === yAttribute && (
              <rect
                y={yPosition}
                x={fullXPosition}
                width={fullWidth}
                height={barHeight}
                key={`${yAttribute}+fullbar`}
                className={cx(options.bars.fullBarClassName, cs.fullBar)}
              />
            )}
          </g>
        );
      },
    );

    return (
      <g
        key={"invisibleStack"}
        fillOpacity={0}
        strokeWidth={options.bars.strokeWidth}
      >
        {invisibleStackComponents}
      </g>
    );
  }

  renderXGrid() {
    const { options, x, barCanvasWidth, barCanvasHeight } = this.state;
    const { normalize } = this.props;

    const tickCount = normalize
      ? round(barCanvasWidth / options.x.tickSpacing, -1)
      : Math.floor(barCanvasWidth / options.x.tickSpacing);
    const xOffsets = x.ticks(tickCount, "s").map((value: $TSFixMe) => x(value));

    return xOffsets.map((xOffset: $TSFixMe) => {
      return (
        <path
          d={`M ${xOffset} 0 v ${barCanvasHeight}`}
          key={`${xOffset}-grid-path`}
          className={cx(options.x.gridClassName, cs.xGrid)}
        />
      );
    });
  }

  render() {
    const { className, events, normalize } = this.props;
    const {
      x,
      y,
      width,
      options,
      labels,
      xAxisHeight,
      barHeight,
      barCanvasHeight,
      barCanvasWidth,
      yAxisWidth,
      redrawNeeded,
    } = this.state;

    const xAxisTitle =
      (normalize ? "Percentage" : "Number") + " of " + options.x.axisTitle;
    const tickFormat = normalize ? numberWithPercent : numberWithSiPrefix;
    const tickCount = normalize
      ? round(barCanvasWidth / options.x.tickSpacing, -1)
      : Math.floor(barCanvasWidth / options.x.tickSpacing);

    if (!redrawNeeded) {
      return (
        <div
          className={cx(className, cs.chart)}
          onMouseMove={event =>
            events.onChartHover(event.clientX, event.clientY)
          }
          onMouseLeave={event => {
            events.onChartHover(event.clientX, event.clientY);
            events.onChartElementExit();
          }}
          ref={ref => (this.references.container = ref)}
        >
          <XAxis
            x={x}
            width={width}
            height={xAxisHeight}
            marginLeft={yAxisWidth}
            title={xAxisTitle}
            tickSize={options.x.tickSize}
            tickCount={tickCount}
            ticksVisible={options.x.ticksVisible}
            tickFormat={(d: number) => tickFormat(d)}
            pathVisible={options.x.pathVisible}
            titleClassName={cx(options.x.axisTitleClassName, cs.xAxisTitle)}
            textClassName={cx(options.x.textClassName, cs.xAxisText)}
          />
          <div className={cx(options.canvasClassName, cs.canvas)}>
            <div className={cs.yAxis}>
              <YAxis
                y={y}
                labels={labels}
                width={yAxisWidth}
                height={barCanvasHeight}
                barHeight={barHeight}
                tickSize={options.y.tickSize}
                ticksVisible={options.y.ticksVisible}
                pathVisible={options.y.pathVisible}
                textClassName={cx(options.y.textClassName, cs.yAxisText)}
                onYAxisLabelClick={this.handleYAxisLabelClick}
                onYAxisLabelEnter={this.handleYAxisLabelEnter}
                onYAxisLabelExit={events.onChartElementExit}
              />
            </div>
            <div data-testid="read-lost-canvas" className={cs.barCanvas}>
              <svg
                data-testid="read-lost-bar"
                width={width - yAxisWidth}
                height={barCanvasHeight}
              >
                <g>
                  {options.x.gridVisible && this.renderXGrid()}
                  {this.renderVisibleStackedBars()}
                  {this.renderInvisibleStackedBars()}
                </g>
              </svg>
            </div>
          </div>
        </div>
      );
    } else {
      // First determine the pixel length and height of the
      // x-axis and y-axis labels, so as to properly size the
      // dimensions of the chart.
      return (
        <div
          data-testid="read-lost-container"
          className={cx(className, cs.chart)}
          ref={ref => (this.references.container = ref)}
        >
          {this.renderAxisBaselines()}
        </div>
      );
    }
  }
}

// @ts-expect-error ts-migrate(2339) FIXME: Property 'defaultProps' does not exist on type 'ty... Remove this comment to see the full error message
HorizontalStackedBarChart.defaultProps = {
  options: defaults,
};
