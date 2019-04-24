import React from "react";
import PropTypes from "prop-types";
import cx from "classnames";

import cs from "./circle_marker.scss";

class CircleMarker extends React.Component {
  render() {
    const { size, onMouseOver, onMouseOut, onClick } = this.props;

    return (
      <svg
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        // Place the viewBox over the point
        style={{ transform: `translate(${-size / 2}px, ${-size / 2}px)` }}
      >
        <circle
          className={cx(cs.circle, onMouseOver && cs.hoverable)}
          // Circle in the center of the viewBox
          cx="50%"
          cy="50%"
          // Don't let edges get cut off of the viewBox. Adjust stroke-width in CSS.
          r={size / 2 - 1}
          onMouseOver={onMouseOver}
          onMouseOut={onMouseOut}
          onClick={onClick}
        />
      </svg>
    );
  }
}

CircleMarker.propTypes = {
  size: PropTypes.number,
  onMouseOver: PropTypes.func,
  onMouseOut: PropTypes.func,
  onClick: PropTypes.func
};

CircleMarker.defaultProps = {
  size: 20
};

export default CircleMarker;
