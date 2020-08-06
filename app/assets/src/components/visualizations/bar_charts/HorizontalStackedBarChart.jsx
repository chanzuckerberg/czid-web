import React from "react";
import ReactDOM from "react-dom";
import PropTypes from "~/components/utils/propTypes";
import { scaleLinear, scaleBand, scaleOrdinal } from "d3-scale";
import { stack } from "d3-shape";
import { max } from "d3-array";
import cx from "classnames";

import cs from "./horizontal_stacked_bar_chart.scss";

// Data passed into this chart should be an array of objects in the form:
// [
//  ...
//  { yAxisKey: yValue1, dataKey1: value1, dataKey2: value2, total: value1 + value2 },
//  { yAxisKey: yValue2, dataKey1: value2, dataKey2: value3, total: value3 + value4 },
//  ...
// ]
// an example object:
// { item: "Donuts", MondaySales: 10, TuesdaySales: 7, total: 17 }

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
    axisHeight: 10,
    pathVisible: true,
    ticksVisible: true,
    gridVisible: true,
    tickSpacing: 45,
    canvasClassName: null,
    axisClassName: null,
    gridClassName: cs.xGrid,
    textClassName: cs.xAxisText,
  },
  y: {
    pathVisible: true,
    ticksVisible: true,
    axisClassName: null,
    textClassName: cs.yAxisText,
  },
  bars: {
    height: 22,
    padding: 6,
    groupClassName: null,
    stackPieceClassName: cs.barPiece,
    fullBarClassName: cs.fullBar,
    emptySpaceClassName: cs.emptyBarSpace,
  },
  margin: {
    top: 20,
    right: 20,
    bottom: 30,
    left: 40,
  },
};

export default class HorizontalStackedBarChart extends React.Component {
  constructor(props) {
    super(props);

    const { data, keys, width, options, yAxisKey } = props;

    const mergedOptions = this.mergeOptionsWithDefaults(defaults, options);

    const stateData = data;

    if (mergedOptions.sort) {
      stateData.sort(mergedOptions.sort);
    }

    const dataKeys = keys.filter(key => key !== yAxisKey);
    const stackGenerator = stack().keys(dataKeys);
    const stackedData = stackGenerator(stateData);

    const {
      height,
      canvasWidth,
      canvasHeight,
      xAxisHeight,
    } = this.createMeasurements(stateData, width, mergedOptions);

    const { x, y, z } = this.createDimensions(
      canvasWidth,
      canvasHeight,
      dataKeys,
      mergedOptions
    );

    y.domain(
      stateData.map(d => {
        return d[yAxisKey];
      })
    );

    x.domain([
      0,
      max(stateData, d => {
        return d.total;
      }),
    ]).nice();

    z.domain(dataKeys);

    this.state = {
      data: stateData,
      options: mergedOptions,
      stackedData,
      keys,
      dataKeys,
      mouseOverBar: null,
      height,
      canvasWidth,
      canvasHeight,
      xAxisHeight,
      barHeight: y.bandwidth(),
      x,
      y,
      z,
    };
  }

  mergeOptionsWithDefaults(defaults, options) {
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

  createMeasurements(data, width, options) {
    const height = data.length * (options.bars.height + options.bars.padding);
    const canvasWidth = width - options.margin.left - options.margin.right;
    const canvasHeight = height - options.margin.bottom;
    const xAxisHeight =
      10 * (options.x.ticksVisible || options.x.pathVisible) +
      options.x.axisHeight +
      options.margin.top;

    return { height, canvasWidth, canvasHeight, xAxisHeight };
  }

  createDimensions(width, height, dataKeys, options) {
    const paddingScalar = options.bars.padding / options.bars.height;

    const x = scaleLinear().range([0, width]);
    const y = scaleBand()
      .range([0, height])
      .paddingInner(paddingScalar)
      .paddingOuter(paddingScalar / 2);
    const z = scaleOrdinal().range(options.colors);

    return { x, y, z };
  }

  renderVisibleStackedBars() {
    const { events, yAxisKey } = this.props;
    const {
      options,
      data,
      dataKeys,
      stackedData,
      barHeight,
      x,
      y,
      z,
    } = this.state;

    const coloredBars = dataKeys.map((key, keyIndex) => {
      const color = z(key);
      const colorStackComponent = stackedData[keyIndex].map(
        (stackPieceRange, stackIndex) => {
          const yAttribute = data[stackIndex][yAxisKey];
          const xLeft = stackPieceRange[0];
          const xRight = stackPieceRange[1];
          const yPosition = y(yAttribute);
          const xPosition = x(xLeft);
          let width = x(xRight - xLeft);

          // keep bars at least 1 pixel wide so they're visible
          if (width < 1) {
            width = 1;
          }

          const valueForStackPiece = data[stackIndex][key];

          return (
            <rect
              y={yPosition}
              x={xPosition}
              width={width}
              height={barHeight}
              key={`${yAttribute}+${keyIndex}`}
              className={options.bars.stackPieceClassName}
              onMouseOver={() =>
                events.onBarStackHover(yAttribute, key, valueForStackPiece)
              }
            />
          );
        }
      );
      return (
        <g fill={color} key={`${color}+${keyIndex}`}>
          {colorStackComponent}
        </g>
      );
    });

    return <g key={"visibleStack"}>{coloredBars}</g>;
  }

  renderInvisibleStackedBars() {
    const { events, yAxisKey } = this.props;
    const {
      data,
      options,
      dataKeys,
      stackedData,
      canvasWidth,
      barHeight,
      mouseOverBar,
      x,
      y,
    } = this.state;

    // Insert a last, transparent bar component for each y-item stack; fill-opacity = 0
    // consists of a stack of two bars; one covers the visible bar, the other the empty space
    // These invisible stack components allows for a function to be passed as a prop to this
    // component that fires when a user's cursor hovers over the empty space to the right
    // of the bar. It also allows for the whole bar to be selected (e.g. via css) instead of
    // just pieces of the stack.
    const invisibleStackComponents = stackedData[stackedData.length - 1].map(
      (stackPieceRange, stackIndex) => {
        const yAttribute = data[stackIndex][yAxisKey];
        const xLeft = 0;
        const xMid = stackPieceRange[1];
        const xRight = canvasWidth;
        const yPosition = y(yAttribute);

        const fullXPosition = x(xLeft);
        const emptyXPosition = x(xMid);

        let fullWidth = x(xMid - xLeft);
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
              fillOpacity={0}
              key={`${yAttribute}+emptybar`}
              className={options.bars.emptySpaceClassName}
              onMouseOver={() =>
                events.onBarEmptySpaceHover(yAttribute, dataForStack)
              }
              onMouseEnter={() => this.setState({ mouseOverBar: yAttribute })}
              onMouseOut={() => this.setState({ mouseOverBar: null })}
            />
            {mouseOverBar === yAttribute && (
              <rect
                y={yPosition}
                x={fullXPosition}
                width={fullWidth}
                height={barHeight}
                fillOpacity={0}
                key={`${yAttribute}+fullbar`}
                className={options.bars.fullBarClassName}
              />
            )}
          </g>
        );
      }
    );

    return <g key={"invisibleStack"}>{invisibleStackComponents}</g>;
  }

  renderYAxis() {
    const { events } = this.props;
    const { options, y, canvasHeight, barHeight } = this.state;

    const textOffset = `translate(-${7 +
      10 * (options.y.ticksVisible || options.y.pathVisible)}, 0)`;

    const tickMap = y.domain().map(yAttribute => {
      const yPosition = y(yAttribute);
      return (
        <g
          key={yAttribute}
          transform={`translate(0, ${yPosition + barHeight / 2})`}
        >
          {options.y.ticksVisible && <line x1={-6} stroke={"currentColor"} />}
          <text
            className={options.y.textClassName}
            key={yAttribute}
            textAnchor={"end"}
            alignmentBaseline={"middle"}
            dominantBaseline={"middle"}
            transform={textOffset}
            onClick={() => events.onYAxisKeyClick(yAttribute)}
          >
            {yAttribute}
          </text>
        </g>
      );
    });

    return (
      <React.Fragment>
        {options.y.pathVisible && (
          <path
            d={["M", 0, 0, "v", canvasHeight].join(" ")}
            fill={"none"}
            stroke={"currentColor"}
          />
        )}
        {tickMap}
      </React.Fragment>
    );
  }

  renderXAxis() {
    const { options, x, canvasWidth, xAxisHeight } = this.state;
    console.log(options);

    const tickCount = Math.floor(canvasWidth / options.x.tickSpacing);
    const tickFormat = x.tickFormat(tickCount, "~s");
    const ticks = x.ticks(tickCount, "s").map(value => ({
      value,
      formatted: tickFormat(value),
      xOffset: x(value),
    }));

    const range = x.range();

    const textOffset = `translate(0, -${xAxisHeight - options.x.axisHeight})`;

    const tickMap = ticks.map(({ value, formatted, xOffset }) => {
      return (
        <g key={value} transform={`translate(${xOffset}, 0)`}>
          {options.x.ticksVisible && <line y2={-6} stroke={"currentColor"} />}
          <text
            key={value}
            textAnchor={"middle"}
            transform={textOffset}
            className={options.x.textClassName}
          >
            {formatted}
          </text>
        </g>
      );
    });

    return (
      <React.Fragment>
        {options.x.pathVisible && (
          <path
            d={["M", range[0], 6, "v", -6, "H", range[1], "v", 6].join(" ")}
            fill={"none"}
            stroke={"currentColor"}
          />
        )}
        {tickMap}
      </React.Fragment>
    );
  }

  renderXGrid() {
    const { options, x, canvasWidth, canvasHeight } = this.state;

    const tickCount = Math.floor(canvasWidth / options.x.tickSpacing);
    const xOffsets = x.ticks(tickCount, "s").map(value => x(value));

    const xGrid = xOffsets.map(xOffset => {
      return (
        <path
          d={`M ${xOffset} 0 v ${canvasHeight}`}
          // fill={"none"}
          // stroke={"#eaeaea"} example value; define in CSS
          key={`${xOffset}-grid-path`}
          className={options.x.gridClassName}
        />
      );
    });

    return xGrid;
  }

  render() {
    const { className, width } = this.props;
    const { options, height, xAxisHeight } = this.state;
    return (
      <div className={className || cs.hzbc}>
        <div className={options.x.canvasClassName}>
          <svg width={width} height={xAxisHeight}>
            <g
              transform={`translate(${options.margin.left}, ${options.margin
                .top + xAxisHeight})`}
            >
              <g
                className={options.x.axisClassName}
                transform={`translate(0, -1)`}
              >
                {this.renderXAxis()}
              </g>
            </g>
          </svg>
        </div>
        <div className={options.canvasClassName}>
          <svg width={width} height={height}>
            <g transform={`translate(${options.margin.left}, 0)`}>
              <g>{options.x.gridVisible && this.renderXGrid()}</g>
              <g className={options.groupClassName}>
                {this.renderVisibleStackedBars()}
                {this.renderInvisibleStackedBars()}
              </g>
              <g className={options.y.axisClassName}>{this.renderYAxis()}</g>
            </g>
          </svg>
        </div>
      </div>
    );
  }
}

HorizontalStackedBarChart.defaultProps = {
  options: defaults,
};

HorizontalStackedBarChart.propTypes = {
  data: PropTypes.array,
  keys: PropTypes.array,
  options: PropTypes.object,
  events: PropTypes.shape({
    onYAxisKeyClick: PropTypes.function,
    onBarStackHover: PropTypes.function,
    onBarEmptySpaceHover: PropTypes.function,
  }),
  yAxisKey: PropTypes.string,
  className: PropTypes.string,
};
