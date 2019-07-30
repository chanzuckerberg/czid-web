import React from "react";
import PropTypes from "prop-types";
import { Marker } from "react-map-gl";

import CircleMarker from "~/components/views/discovery/mapping/CircleMarker";
import RectangleMarker from "~/components/views/discovery/mapping/RectangleMarker";

class ShapeMarker extends React.Component {
  render() {
    let {
      active,
      divisorConst,
      lat,
      lng,
      maxSize,
      minSize,
      onClick,
      onMouseEnter,
      onMouseLeave,
      pointCount,
      rectangular,
      size,
      sizeMultiple,
      title,
      zoom,
    } = this.props;

    // Scale based on the zoom and point count (zoomed-in = higher zoom).
    // Determined via eyeballing: scaling of a form x/(x+c) shows large differences at the lower
    // end of the range and smaller differences as it approaches a horizontal asymptote.
    // clamp(min, x/(x+c) * m * z, max)
    const computedSize =
      size ||
      Math.min(
        Math.max(
          pointCount / (pointCount + divisorConst) * sizeMultiple * zoom,
          minSize
        ),
        maxSize
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
  divisorConst: 400,
  maxSize: 90,
  minSize: 10,
  sizeMultiple: 60,
  zoom: 3,
};

ShapeMarker.propTypes = {
  active: PropTypes.bool,
  divisorConst: PropTypes.number,
  lat: PropTypes.number,
  lng: PropTypes.number,
  maxSize: PropTypes.number,
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
