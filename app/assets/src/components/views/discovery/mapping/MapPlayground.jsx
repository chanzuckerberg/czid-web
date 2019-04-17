import React from "react";
import PropTypes from "prop-types";
import { Marker } from "react-map-gl";
import { get } from "lodash/fp";

import BaseMap from "~/components/views/discovery/mapping/BaseMap";
import BubbleMarker from "~/components/views/discovery/mapping//BubbleMarker";

class MapPlayground extends React.Component {
  state = {
    locationsToSamples: {},
    viewport: {}
  };

  componentDidMount() {
    const { results } = this.props;

    const locationsToSamples = Object.assign({}, this.state.locationsToSamples);
    results.forEach(result => {
      // Display existing coordinate strings
      if (/\d/.test(result.location)) {
        const loc = result.location.replace(/_/g, ", ");
        const formatted = {
          name: result.name,
          id: result.id,
          location: loc
        };

        if (locationsToSamples.hasOwnProperty(loc)) {
          locationsToSamples[loc].push(formatted);
        } else {
          locationsToSamples[loc] = [formatted];
        }
      }
    });
    this.setState({ locationsToSamples });
  }

  updateViewport = viewport => {
    this.setState({ viewport });
  };

  renderMarker = (marker, index) => {
    const [lat, lon] = marker[0].split(", ");
    const pointCount = marker[1].length;
    return (
      <Marker
        key={`marker-${index}`}
        latitude={parseFloat(lat)}
        longitude={parseFloat(lon)}
      >
        <BubbleMarker
          size={pointCount * (get("zoom", this.state.viewport) || 3)}
        />
      </Marker>
    );
  };

  render() {
    const { mapTilerKey } = this.props;
    const { locationsToSamples } = this.state;

    return (
      <BaseMap
        markers={Object.entries(locationsToSamples)}
        mapTilerKey={mapTilerKey}
        renderMarker={this.renderMarker}
        updateViewport={this.updateViewport}
      />
    );
  }
}

MapPlayground.propTypes = {
  results: PropTypes.array,
  // Access tokens safe for clients
  mapTilerKey: PropTypes.string
};

export default MapPlayground;
