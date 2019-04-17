import React from "react";
import PropTypes from "prop-types";
import cx from "classnames";

import BasicPopup from "~/components/BasicPopup";
import cs from "./bubble_marker.scss";

class BubbleMarker extends React.Component {
  render() {
    const { size, onClick, hoverContent } = this.props;

    const circleBody = (
      <circle
        cx="50%"
        cy="50%"
        // Don't let edges get cut off in the viewBox
        r={Math.max(size - 4, 1) / 2}
        onClick={onClick}
        className={cx(cs.circle, hoverContent && cs.hoverable)}
      />
    );
    return (
      <svg
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        // Proper centering
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

BubbleMarker.propTypes = {
  size: PropTypes.number,
  onClick: PropTypes.func,
  hoverContent: PropTypes.string
};

BubbleMarker.defaultProps = {
  size: 20
};

export default BubbleMarker;
