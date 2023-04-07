import cx from "classnames";
import React from "react";
import cs from "./rectangle_marker.scss";

interface RectangleMarkerProps {
  active?: boolean;
  onMouseEnter?: $TSFixMeFunction;
  onMouseLeave?: $TSFixMeFunction;
  onClick?: $TSFixMeFunction;
  title?: string;
}

class RectangleMarker extends React.Component<RectangleMarkerProps> {
  render() {
    const { active, onMouseEnter, onMouseLeave, onClick, title } = this.props;

    return (
      <div
        className={cx(
          cs.rectangle,
          onMouseEnter && cs.hoverable,
          active && cs.active,
        )}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        onClick={onClick}>
        {title}
      </div>
    );
  }
}

export default RectangleMarker;
