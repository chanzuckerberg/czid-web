import React from "react";
import PropTypes from "prop-types";
import cx from "classnames";

import BasicPopup from "~/components/BasicPopup";
import cs from "./circle_marker.scss";

class CircleMarker extends React.Component {
  render() {
    const { size, onClick, hoverContent } = this.props;

    const circleBody = (
      <circle
        // Circle in the center of the viewBox
        cx="50%"
        cy="50%"
        // Don't let edges get cut off of the viewBox. Adjust stroke-width in CSS.
        r={(size - 2) / 2}
        onClick={onClick}
        className={cx(cs.circle, hoverContent && cs.hoverable)}
      />
    );
    return (
      <svg
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        // Place the viewBox over the point
        style={{ transform: `translate(${-size / 2}px, ${-size / 2}px)` }}
      >
        {hoverContent ? (
          <BasicPopup trigger={circleBody} content={hoverContent} />
        ) : (
          circleBody
        )}
      </svg>
    );
  }
}

CircleMarker.propTypes = {
  size: PropTypes.number,
  onClick: PropTypes.func,
  hoverContent: PropTypes.string
};

CircleMarker.defaultProps = {
  size: 20
};

export default CircleMarker;
