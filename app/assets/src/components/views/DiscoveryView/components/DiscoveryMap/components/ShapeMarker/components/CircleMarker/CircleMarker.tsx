import cx from "classnames";
import React from "react";
import cs from "./circle_marker.scss";

interface CircleMarkerProps {
  active?: boolean;
  size?: number;
  onMouseEnter?: $TSFixMeFunction;
  onMouseLeave?: $TSFixMeFunction;
  onClick?: $TSFixMeFunction;
}

class CircleMarker extends React.Component<CircleMarkerProps> {
  render() {
    const { active, size, onMouseEnter, onMouseLeave, onClick } = this.props;

    return (
      <svg
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        // Place the viewBox over the point
        // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2532
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
          // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2532
          r={size / 2}
          onMouseEnter={onMouseEnter}
          onMouseLeave={onMouseLeave}
          onClick={onClick}
        />
      </svg>
    );
  }
}
// @ts-expect-error Property 'defaultProps' does not exist on type
CircleMarker.defaultProps = {
  size: 20,
};

export default CircleMarker;
