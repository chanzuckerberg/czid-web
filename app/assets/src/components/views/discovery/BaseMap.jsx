import React from "react";
import PropTypes from "prop-types";
import MapGL from "react-map-gl";

import cs from "./base_map.scss";

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

  render() {
    const { mapTilerKey, renderMarker, markers } = this.props;
    const { viewport } = this.state;

    const styleURL = `https://api.maptiler.com/maps/f18295ae-cc7c-4b79-a146-24c503367ffd/style.json?key=${mapTilerKey}`;
    return (
      <div className={cs.mapContainer}>
        <MapGL
          {...viewport}
          onViewportChange={viewport => this.setState({ viewport })}
          mapStyle={styleURL}
        >
          {markers && markers.map(renderMarker)}
        </MapGL>
      </div>
    );
  }
}

BaseMap.propTypes = {
  markers: PropTypes.array,
  mapTilerKey: PropTypes.string.isRequired,
  renderMarker: PropTypes.func,
  width: PropTypes.number,
  height: PropTypes.number,
  latitude: PropTypes.number,
  longitude: PropTypes.number,
  zoom: PropTypes.number
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
