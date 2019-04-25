import React from "react";
import PropTypes from "prop-types";
import { Popup } from "react-map-gl";

import cs from "./map_tooltip.scss";

class MapTooltip extends React.Component {
  render() {
    const {
      lat,
      lng,
      title,
      body,
      onTitleClick,
      onMouseEnter,
      onMouseLeave
    } = this.props;

    return (
      <Popup
        className={cs.tooltip}
        anchor="bottom"
        tipSize={10}
        latitude={lat}
        longitude={lng}
        closeButton={false}
        offsetTop={-15}
      >
        <div onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave}>
          <div>{title}</div>
          <div>{body}</div>
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
  onTitleClick: PropTypes.func,
  onMouseEnter: PropTypes.func,
  onMouseLeave: PropTypes.func
};

export default MapTooltip;
