import cx from "classnames";
import PropTypes from "prop-types";
import React from "react";

import cs from "./rectangle_marker.scss";

class RectangleMarker extends React.Component {
  render() {
    const { active, onMouseEnter, onMouseLeave, onClick, title } = this.props;

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
  onMouseEnter: PropTypes.func,
  onMouseLeave: PropTypes.func,
  onClick: PropTypes.func,
  title: PropTypes.string,
};

export default RectangleMarker;
