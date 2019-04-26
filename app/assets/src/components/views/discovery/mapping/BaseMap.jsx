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
    const { updateViewport } = this.props;
    this.setState({ viewport });
    updateViewport && updateViewport(viewport);
  };

  render() {
    const { mapTilerKey, tooltip, markers, popups } = this.props;
    const { viewport } = this.state;

    const styleURL = `https://api.maptiler.com/maps/${MAP_STYLE_ID}/style.json?key=${mapTilerKey}`;
    return (
      <div className={cs.mapContainer}>
        <MapGL
          {...viewport}
          onViewportChange={this.updateViewport}
          mapStyle={styleURL}
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
  tooltip: PropTypes.node,
  markers: PropTypes.array,
  popups: PropTypes.array
};

BaseMap.defaultProps = {
  width: 1000,
  height: 1000,
  // United States framed
  latitude: 40,
  longitude: -98,
  zoom: 3
};

export default BaseMap;
