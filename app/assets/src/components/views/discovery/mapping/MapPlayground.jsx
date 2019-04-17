import React from "react";
import PropTypes from "prop-types";
import { Marker } from "react-map-gl";
import { get } from "lodash/fp";

import BaseMap from "~/components/views/discovery/mapping/BaseMap";
import CircleMarker from "~/components/views/discovery/mapping/CircleMarker";

class MapPlayground extends React.Component {
  state = {
    locationsToSamples: {},
    viewport: {}
  };

  componentDidMount() {
    const { results } = this.props;

    const locationsToSamples = Object.assign({}, this.state.locationsToSamples);
    results.forEach(result => {
      // Match locations that look like coordinates separated by a comma
      const loc = result.location.replace(/_/g, ", ");
      if (loc.match(/^[-0-9.]+,(\s)?[-0-9.]+?$/)) {
        const formatted = {
          name: result.name,
          id: result.id
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

  renderMarker = (markerData, index) => {
    const [lat, lon] = markerData[0].split(",");
    const pointCount = markerData[1].length;
    const minSize = 14;
    // Scale based on the zoom and point count (zoomed-in = higher zoom)
    const markerSize = Math.max(
      pointCount * (get("zoom", this.state.viewport) || 3),
      minSize
    );
    return (
      <Marker
        key={`marker-${index}`}
        latitude={parseFloat(lat)}
        longitude={parseFloat(lon)}
      >
        <CircleMarker
          size={markerSize}
          hoverContent={`${pointCount} sample${pointCount > 1 ? "s" : ""}`}
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
