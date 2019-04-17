import React from "react";
import PropTypes from "prop-types";

export default class BubbleMarker extends React.Component {
  render() {
    const { size, onClick, fill, stroke, opacity } = this.props;
    return (
      <svg
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        style={{
          fill,
          stroke,
          opacity,
          // Proper centering
          transform: `translate(${-size / 2}px,${-size / 2}px)`
        }}
      >
        <circle
          cx="50%"
          cy="50%"
          // Edges get cut off
          r={Math.max(size - 5, 1) / 2}
          onClick={onClick}
          style={{ cursor: "pointer" }}
        />
      </svg>
    );
  }
}

BubbleMarker.propTypes = {
  size: PropTypes.number,
  fill: PropTypes.string,
  stroke: PropTypes.string,
  opacity: PropTypes.number,
  onClick: PropTypes.func
};

BubbleMarker.defaultProps = {
  size: 20,
  fill: "#FF0000",
  stroke: "#000000",
  opacity: 0.5
};
