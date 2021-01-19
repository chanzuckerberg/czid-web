import React from "react";
import PropTypes from "~/components/utils/propTypes";
import cx from "classnames";

import cs from "./y_axis.scss";

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
}) {
  const renderText = () => {
    const textOffset = `translate(-${7 +
      tickSize * (ticksVisible || pathVisible)}, 0)`;

    const tickMapping = y.domain().map((yAttribute, index) => {
      const yPosition = y(yAttribute);
      const displayName = labels[index];
      return (
        <g
          key={yAttribute}
          transform={`translate(0, ${yPosition + barHeight / 2})`}
        >
          {ticksVisible && <line x1={-1 * tickSize} stroke={"currentColor"} />}
          <text
            className={cx(textClassName, cs.text)}
            key={yAttribute}
            textAnchor={"end"}
            alignmentBaseline={"middle"}
            dominantBaseline={"middle"}
            transform={textOffset}
            onClick={() => onYAxisLabelClick(yAttribute, index)}
            onMouseEnter={() => onYAxisLabelEnter(yAttribute)}
            onMouseLeave={() => onYAxisLabelExit()}
          >
            {displayName}
          </text>
        </g>
      );
    });

    return tickMapping;
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

YAxis.propTypes = {
  y: PropTypes.func,
  labels: PropTypes.array,
  width: PropTypes.number,
  height: PropTypes.number,
  barHeight: PropTypes.number,
  tickSize: PropTypes.number,
  ticksVisible: PropTypes.bool,
  pathVisible: PropTypes.bool,
  textClassName: PropTypes.string,
  onYAxisLabelClick: PropTypes.func,
  onYAxisLabelEnter: PropTypes.func,
  onYAxisLabelExit: PropTypes.func,
};
