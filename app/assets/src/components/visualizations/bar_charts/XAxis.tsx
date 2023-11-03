import cx from "classnames";
import React from "react";
import cs from "./x_axis.scss";

interface XAxisProps {
  x?;
  width?: number;
  marginLeft?: number;
  tickFormat?(...args: unknown[]): unknown;
  tickSize?: number;
  tickCount?: number;
  ticksVisible?: boolean;
  pathVisible?: boolean;
  title?: string;
  titleClassName?: string;
  textClassName?: string;
  height?: number;
}

export default function XAxis({
  x,
  width,
  marginLeft,
  tickFormat,
  tickSize,
  tickCount,
  ticksVisible,
  pathVisible,
  title,
  titleClassName,
  textClassName,
  height,
}: XAxisProps) {
  const renderAxis = () => {
    const ticks = x.ticks(tickCount, "s").map(value => ({
      value,
      // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2722
      formatted: tickFormat(value),
      xOffset: x(value),
    }));

    return ticks.map(({ value, formatted, xOffset }) => {
      return (
        <g key={value} transform={`translate(${xOffset}, 0)`}>
          <g key={`tick-at-${value}`} transform={`translate(0, ${height})`}>
            {ticksVisible && (
              // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2532
              <line y2={-1 * tickSize} stroke={"currentColor"} />
            )}
          </g>
          <text
            className={cx(textClassName, cs.text)}
            key={value}
            textAnchor={"middle"}
            dominantBaseline={"middle"}
            // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2532
            transform={`translate(0, ${height / 2})`}
          >
            {formatted}
          </text>
        </g>
      );
    });
  };

  const range = x.range();

  return (
    <div className={cs.xAxis}>
      <div className={titleClassName} style={{ width: width }}>
        {/* @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2532 */}
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
