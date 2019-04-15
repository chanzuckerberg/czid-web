import React from "react";
import PropTypes from "prop-types";
import MapGL, { Marker } from "react-map-gl";

import CheckmarkIcon from "~ui/icons/CheckmarkIcon";
import cs from "./map_playground.scss";

class MapPlayground extends React.Component {
  state = {
    viewport: {
      width: 1000,
      height: 1000,
      latitude: 37.7577,
      longitude: -122.4376,
      zoom: 8
    }
  };

  componentDidMount() {
    const { locations, locationIQKey } = this.props;
    window.unwired.key = locationIQKey;

    let toDisplay = [];
    locations.forEach(loc => {
      // Display existing coordinate strings
      if (/\d/.test(loc)) {
        loc = loc.replace(/_/g, ", ");
        const [lat, lon] = loc.split(", ");
        const formatted = {
          name: loc,
          latitude: parseFloat(lat),
          longitude: parseFloat(lon)
        };
        toDisplay.push(formatted);
      }
    });

    this.setState({ toDisplay });
  }

  renderMarker = (sample, index) => {
    return (
      <Marker
        key={`marker-${index}`}
        longitude={sample.longitude}
        latitude={sample.latitude}
      >
        <CheckmarkIcon size="small" />
      </Marker>
    );
  };

  render() {
    const { viewport, toDisplay } = this.state;

    return toDisplay ? (
      <div>
        <div className={cs.mapContainer}>
          <MapGL
            {...viewport}
            onViewportChange={viewport => this.setState({ viewport })}
            mapStyle={window.unwired.getLayer("streets")}
          >
            {toDisplay.map(this.renderMarker)}
          </MapGL>
        </div>
      </div>
    ) : null;
  }
}

MapPlayground.propTypes = {
  locations: PropTypes.array,
  // Access token safe for clients (https://locationiq.com/docs-html/index.html#access-tokens)
  locationIQKey: PropTypes.string
};

export default MapPlayground;
