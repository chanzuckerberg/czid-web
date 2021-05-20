import cx from "classnames";
import React from "react";
import PropTypes from "~/components/utils/propTypes";

import { numberWithSiPrefix } from "~/helpers/strings";

import cs from "./x_axis.scss";

export default function XAxis({
  x,
  width,
  marginLeft,
  tickSize,
  tickSpacing,
  ticksVisible,
  pathVisible,
  title,
  titleClassName,
  textClassName,
  barCanvasWidth,
  height,
}) {
  const renderAxis = () => {
    const tickCount = Math.floor(barCanvasWidth / tickSpacing);
    const ticks = x.ticks(tickCount, "s").map(value => ({
      value,
      formatted: numberWithSiPrefix(value),
      xOffset: x(value),
    }));

    const tickMapping = ticks.map(({ value, formatted, xOffset }) => {
      return (
        <g key={value} transform={`translate(${xOffset}, 0)`}>
          <g key={`tick-at-${value}`} transform={`translate(0, ${height})`}>
            {ticksVisible && (
              <line y2={-1 * tickSize} stroke={"currentColor"} />
            )}
          </g>
          <text
            className={cx(textClassName, cs.text)}
            key={value}
            textAnchor={"middle"}
            dominantBaseline={"middle"}
            transform={`translate(0, ${height / 2})`}
          >
            {formatted}
          </text>
        </g>
      );
    });

    return tickMapping;
  };

  const range = x.range();

  return (
    <div className={cs.xAxis}>
      <div className={titleClassName} style={{ width: width }}>
        <div style={{ width: width - marginLeft, marginLeft: marginLeft }}>
          {title}
        </div>
      </div>
      <svg width={width} height={height}>
        <g transform={`translate(${marginLeft}, 0)`}>
          {pathVisible && (
            <g transform={`translate(0, ${height})`}>
              <path
                d={["M", range[0], 6, "v", -6, "H", range[1], "v", 6].join(" ")}
                fill={"none"}
                stroke={"currentColor"}
              />
            </g>
          )}
          {renderAxis()}
        </g>
      </svg>
    </div>
  );
}

XAxis.propTypes = {
  x: PropTypes.func,
  width: PropTypes.number,
  marginLeft: PropTypes.number,
  tickSize: PropTypes.number,
  tickSpacing: PropTypes.number,
  ticksVisible: PropTypes.bool,
  pathVisible: PropTypes.bool,
  title: PropTypes.string,
  titleClassName: PropTypes.string,
  textClassName: PropTypes.string,
  barCanvasWidth: PropTypes.number,
  height: PropTypes.number,
};
