import cx from "classnames";
import PropTypes from "prop-types";
import React from "react";

import { Popup } from "react-map-gl";

import cs from "./map_tooltip.scss";

class MapTooltip extends React.Component {
  render() {
    const {
      lat,
      lng,
      title,
      body,
      onMouseEnter,
      onMouseLeave,
      onTitleClick,
    } = this.props;

    return (
      <Popup
        className={cs.mapTooltip}
        anchor="bottom"
        tipSize={0}
        latitude={lat}
        longitude={lng}
        closeButton={false}
        offsetTop={-20}
      >
        <div
          className={cs.content}
          onMouseEnter={onMouseEnter}
          onMouseLeave={onMouseLeave}
        >
          <div>
            <span
              className={cx(cs.title, onTitleClick && cs.hoverable)}
              onClick={onTitleClick}
            >
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

MapTooltip.propTypes = {
  lat: PropTypes.number.isRequired,
  lng: PropTypes.number.isRequired,
  title: PropTypes.string,
  body: PropTypes.string,
  onMouseEnter: PropTypes.func,
  onMouseLeave: PropTypes.func,
  onTitleClick: PropTypes.func,
};

export default MapTooltip;
