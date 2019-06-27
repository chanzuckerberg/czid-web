import React from "react";
import PropTypes from "prop-types";
import cx from "classnames";

import cs from "./rectangle_marker.scss";

class RectangleMarker extends React.Component {
  render() {
    const {
      active,
      size,
      onMouseEnter,
      onMouseLeave,
      onClick,
      title,
    } = this.props;

    return (
      <div
        className={cx(
          cs.rectangle,
          onMouseEnter && cs.hoverable,
          active && cs.active
        )}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        onClick={onClick}
      >
        {title}
      </div>
    );
  }
}

RectangleMarker.propTypes = {
  active: PropTypes.bool,
  size: PropTypes.number,
  onMouseEnter: PropTypes.func,
  onMouseLeave: PropTypes.func,
  onClick: PropTypes.func,
  title: PropTypes.string,
};

RectangleMarker.defaultProps = {
  size: 20,
};

export default RectangleMarker;
