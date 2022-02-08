import cx from "classnames";
import PropTypes from "prop-types";
import React from "react";

import cs from "./circle_marker.scss";

class CircleMarker extends React.Component {
  render() {
    const { active, size, onMouseEnter, onMouseLeave, onClick } = this.props;

    return (
      <svg
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        // Place the viewBox over the point
        style={{ transform: `translate(${-size / 2}px, ${-size / 2}px)` }}
      >
        <circle
          className={cx(
            cs.circle,
            onMouseEnter && cs.hoverable,
            active && cs.active,
          )}
          // Circle in the center of the viewBox
          cx="50%"
          cy="50%"
          r={size / 2}
          onMouseEnter={onMouseEnter}
          onMouseLeave={onMouseLeave}
          onClick={onClick}
        />
      </svg>
    );
  }
}

CircleMarker.propTypes = {
  active: PropTypes.bool,
  size: PropTypes.number,
  onMouseEnter: PropTypes.func,
  onMouseLeave: PropTypes.func,
  onClick: PropTypes.func,
};

CircleMarker.defaultProps = {
  size: 20,
};

export default CircleMarker;
