import React from "react";
import PropTypes from "prop-types";
import { Marker } from "react-map-gl";

import CircleMarker from "~/components/views/discovery/mapping/CircleMarker";
import RectangleMarker from "~/components/views/discovery/mapping/RectangleMarker";

class ShapeMarker extends React.Component {
  render() {
    const {
      active,
      lat,
      lng,
      minSize,
      onClick,
      onMouseEnter,
      onMouseLeave,
      pointCount,
      rectangular,
      sizeLogBase,
      title,
      zoom,
    } = this.props;

    // Scale based on the zoom and point count (zoomed-in = higher zoom)
    // Log1.3 of the count looked nice visually for not getting too large with many points.
    const size = Math.max(
      Math.log(pointCount) / Math.log(sizeLogBase) * zoom,
      minSize
    );

    return (
      <Marker latitude={lat} longitude={lng}>
        {rectangular ? (
          <RectangleMarker
            active={active}
            onClick={onClick}
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
            title={title}
          />
        ) : (
          <CircleMarker
            active={active}
            onClick={onClick}
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
            size={size}
          />
        )}
      </Marker>
    );
  }
}

// Defaults determined via eyeballing.
ShapeMarker.defaultProps = {
  zoom: 3,
  minSize: 14,
  sizeLogBase: 1.3,
};

ShapeMarker.propTypes = {
  active: PropTypes.bool,
  lat: PropTypes.number,
  lng: PropTypes.number,
  minSize: PropTypes.number,
  onClick: PropTypes.func,
  onMouseEnter: PropTypes.func,
  onMouseLeave: PropTypes.func,
  pointCount: PropTypes.number,
  rectangular: PropTypes.bool,
  sizeLogBase: PropTypes.number,
  title: PropTypes.string,
  zoom: PropTypes.number,
};

export default ShapeMarker;
