import React from "react";
import PropTypes from "prop-types";
import MapGL, { NavigationControl } from "react-map-gl";

import cs from "./base_map.scss";

// MapTiler map name: "2019-04-24"
export const MAP_STYLE_ID = "f0e7922a-43cf-4dc5-b598-17ae1f56d2f4";

class BaseMap extends React.Component {
  constructor(props) {
    super(props);

    const { width, height, latitude, longitude, zoom } = this.props;
    this.state = {
      viewport: {
        width,
        height,
        latitude,
        longitude,
        zoom
      }
    };
  }

  updateViewport = viewport => {
    const { updateViewport, panBounds } = this.props;
    console.log("Before: ", viewport.latitude, viewport.longitude);
    viewport.zoom = Math.max(1.3, viewport.zoom);
    viewport.latitude = Math.min(50, Math.max(-40, viewport.latitude));
    viewport.longitude = Math.min(
      panBounds.maxLongitude,
      Math.max(panBounds.minLongitude, viewport.longitude)
    );
    console.log(viewport);
    console.log(viewport.latitude, viewport.longitude);
    this.setState({ viewport });
    updateViewport && updateViewport(viewport);
  };

  render() {
    const { mapTilerKey, tooltip, markers, popups } = this.props;
    const { viewport } = this.state;

    const styleURL = `https://api.maptiler.com/maps/${MAP_STYLE_ID}/style.json?key=${mapTilerKey}`;
    const bounds = [
      [-180, -70], // Southwest coordinates
      [180, 75] // Northeast coordinates
    ];
    return (
      <div className={cs.mapContainer}>
        <MapGL
          {...viewport}
          onViewportChange={this.updateViewport}
          mapStyle={styleURL}
          // mapOptions={{ maxBounds: bounds }}
        >
          {tooltip}
          {markers}
          {popups}

          <NavigationControl
            onViewportChange={this.updateViewport}
            showCompass={false}
            className={cs.zoomControl}
          />
        </MapGL>
      </div>
    );
  }
}

BaseMap.propTypes = {
  mapTilerKey: PropTypes.string.isRequired,
  updateViewport: PropTypes.func,
  width: PropTypes.number,
  height: PropTypes.number,
  latitude: PropTypes.number,
  longitude: PropTypes.number,
  zoom: PropTypes.number,
  panBounds: PropTypes.objectOf(PropTypes.number),
  tooltip: PropTypes.node,
  markers: PropTypes.array,
  popups: PropTypes.array
};

BaseMap.defaultProps = {
  width: 1250,
  height: 1000,
  // United States framed
  latitude: 40,
  longitude: -98,
  zoom: 3,
  panBounds: {
    minLatitude: -70,
    maxLatitude: 75,
    minLongitude: -180,
    maxLongitude: 180
  }
};

export default BaseMap;
