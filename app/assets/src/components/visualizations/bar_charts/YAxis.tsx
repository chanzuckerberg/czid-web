import cx from "classnames";
import React from "react";
import cs from "./y_axis.scss";

interface YAxisProps {
  y?;
  labels?: string[];
  width?: number;
  height?: number;
  barHeight?: number;
  tickSize?: number;
  ticksVisible?: boolean;
  pathVisible?: boolean;
  textClassName?: string;
  onYAxisLabelClick?(...args: unknown[]): unknown;
  onYAxisLabelEnter?(...args: unknown[]): unknown;
  onYAxisLabelExit?(...args: unknown[]): unknown;
}

export default function YAxis({
  y,
  labels,
  width,
  height,
  barHeight,
  tickSize,
  ticksVisible,
  pathVisible,
  textClassName,
  onYAxisLabelClick,
  onYAxisLabelEnter,
  onYAxisLabelExit,
}: YAxisProps) {
  const renderText = () => {
    const textOffset = `translate(-${
      // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2532
      7 + tickSize * Number(ticksVisible || pathVisible)
    }, 0)`;

    return y.domain().map((yAttribute, index) => {
      const yPosition = y(yAttribute);
      // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2532
      const displayName = labels[index];
      return (
        <g
          key={yAttribute}
          // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2532
          transform={`translate(0, ${yPosition + barHeight / 2})`}
        >
          {/* @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2532 */}
          {ticksVisible && <line x1={-1 * tickSize} stroke={"currentColor"} />}
          <text
            className={cx(textClassName, cs.text)}
            key={yAttribute}
            textAnchor={"end"}
            alignmentBaseline={"middle"}
            dominantBaseline={"middle"}
            transform={textOffset}
            // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2722
            onClick={() => onYAxisLabelClick(yAttribute, index)}
            // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2722
            onMouseEnter={() => onYAxisLabelEnter(yAttribute)}
            // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2722
            onMouseLeave={() => onYAxisLabelExit()}
          >
            {displayName}
          </text>
        </g>
      );
    });
  };

  return (
    <svg width={width} height={height}>
      <g transform={`translate(${width}, 0)`}>
        {pathVisible && (
          <path
            d={["M", 0, 0, "v", height].join(" ")}
            fill={"none"}
            stroke={"currentColor"}
          />
        )}
        {renderText()}
      </g>
    </svg>
  );
}
