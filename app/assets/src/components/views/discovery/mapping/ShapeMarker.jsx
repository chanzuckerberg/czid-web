import React from "react";
import PropTypes from "prop-types";
import { Marker } from "react-map-gl";

import CircleMarker from "~/components/views/discovery/mapping/CircleMarker";
import RectangleMarker from "~/components/views/discovery/mapping/RectangleMarker";

class ShapeMarker extends React.Component {
  render() {
    let {
      active,
      lat,
      lng,
      onClick,
      onMouseEnter,
      onMouseLeave,
      pointCount,
      rectangular,
      size,
      sizeMultiple,
      title,
      zoom,
      minSize,
    } = this.props;

    // Scale based on the zoom and point count (zoomed-in = higher zoom)
    // Log2 of the count scaled looked nice visually for not getting too large with many points.
    const options = [1, 100, 1000, 3000];
    pointCount = options[Math.floor(Math.random() * options.length)];
    const computedSize =
      size ||
      Math.max(
        10 * pointCount / (100 + pointCount) * sizeMultiple * zoom,
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
            size={computedSize}
          />
        )}
      </Marker>
    );
  }
}

// Defaults determined via eyeballing.
ShapeMarker.defaultProps = {
  minSize: 14,
  sizeMultiple: 10,
  zoom: 3,
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
  // Size override
  size: PropTypes.number,
  sizeMultiple: PropTypes.number,
  title: PropTypes.string,
  zoom: PropTypes.number,
};

export default ShapeMarker;
