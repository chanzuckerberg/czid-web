import cx from "classnames";
import React from "react";
import { Popup } from "react-map-gl";
import cs from "./map_tooltip.scss";

interface MapTooltipProps {
  lat: number;
  lng: number;
  title?: string;
  body?: string;
  onMouseEnter?: $TSFixMeFunction;
  onMouseLeave?: $TSFixMeFunction;
  onTitleClick?: $TSFixMeFunction;
}

class MapTooltip extends React.Component<MapTooltipProps> {
  render() {
    const { lat, lng, title, body, onMouseEnter, onMouseLeave, onTitleClick } =
      this.props;

    return (
      <Popup
        className={cs.mapTooltip}
        anchor="bottom"
        tipSize={0}
        latitude={lat}
        longitude={lng}
        closeButton={false}
        offsetTop={-20}>
        <div
          className={cs.content}
          onMouseEnter={onMouseEnter}
          onMouseLeave={onMouseLeave}>
          <div>
            <span
              className={cx(cs.title, onTitleClick && cs.hoverable)}
              onClick={onTitleClick}>
              {title}
            </span>
          </div>
          <div>
            <span className={cs.body}>{body}</span>
          </div>
        </div>
      </Popup>
    );
  }
}

export default MapTooltip;
