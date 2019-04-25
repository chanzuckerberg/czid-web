import React from "react";
import PropTypes from "prop-types";
import cx from "classnames";
import { Popup } from "react-map-gl";

class MapTooltip extends React.Component {
  render() {
    const {
      lat,
      lng,
      closeButton,
      title,
      body,
      onTitleClick,
      onMouseEnter,
      onMouseLeave
    } = this.props;

    return (
      <Popup
        // className={cs.dataTooltipContainer}
        anchor="bottom"
        tipSize={10}
        latitude={lat}
        longitude={lng}
        closeButton={closeButton}
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
  closeButton: PropTypes.bool,
  title: PropTypes.string,
  body: PropTypes.string,
  onTitleClick: PropTypes.func,
  onMouseEnter: PropTypes.func,
  onMouseLeave: PropTypes.func
};

MapTooltip.defaultProps = {
  closeButton: false
};

export default MapTooltip;
