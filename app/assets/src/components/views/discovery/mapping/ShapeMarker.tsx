import { clamp } from "lodash/fp";
import React from "react";
import { Marker } from "react-map-gl";
import CircleMarker from "~/components/views/discovery/mapping/CircleMarker";
import RectangleMarker from "~/components/views/discovery/mapping/RectangleMarker";

interface ShapeMarkerProps {
  active?: boolean;
  divisorConst?: number;
  lat?: number;
  lng?: number;
  maxSize?: number;
  minSize?: number;
  onClick?: $TSFixMeFunction;
  onMouseEnter?: $TSFixMeFunction;
  onMouseLeave?: $TSFixMeFunction;
  pointCount?: number;
  rectangular?: boolean;
  // Size override
  size?: number;
  sizeMultiple?: number;
  title?: string;
  zoom?: number;
}

class ShapeMarker extends React.Component<ShapeMarkerProps> {
  render() {
    const {
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

    // Scale based on the zoom and point count (zoomed-in = higher zoom)
    // Determined via eyeballing: scaling of a form x/(x+c) shows larger differences at the lower
    // end of the range and smaller differences as it approaches a horizontal asymptote.
    const computedSize =
      size ||
      clamp(
        // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2769
        minSize,
        maxSize,
        // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2532
        (pointCount / (pointCount + divisorConst)) * sizeMultiple * zoom,
      );

    return (
      // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2322
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
// @ts-expect-error Property 'defaultProps' does not exist on type
ShapeMarker.defaultProps = {
  divisorConst: 400,
  maxSize: 90,
  minSize: 10,
  sizeMultiple: 60,
  zoom: 3,
};

export default ShapeMarker;
