import React from "react";
import PropTypes from "prop-types";
import { Marker } from "react-map-gl";

import CheckmarkIcon from "~ui/icons/CheckmarkIcon";
import BaseMap from "~/components/views/discovery/mapping/BaseMap";
import BubbleMarker from "./BubbleMarker";

class MapPlayground extends React.Component {
  state = {
    toDisplay: []
  };

  componentDidMount() {
    const { locations } = this.props;

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

  renderMarkerBubble = (point, index) => {
    return (
      <Marker
        key={`marker-${index}`}
        longitude={point.longitude}
        latitude={point.latitude}
      >
        <BubbleMarker />
      </Marker>
    );
  };

  render() {
    const { mapTilerKey } = this.props;
    const { toDisplay } = this.state;

    return (
      <BaseMap
        markers={toDisplay}
        mapTilerKey={mapTilerKey}
        renderMarker={this.renderMarkerBubble}
      />
    );
  }
}

MapPlayground.propTypes = {
  locations: PropTypes.array,
  // Access tokens safe for clients
  mapTilerKey: PropTypes.string
};

export default MapPlayground;
