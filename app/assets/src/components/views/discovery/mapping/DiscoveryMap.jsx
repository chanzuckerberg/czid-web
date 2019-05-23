import React from "react";
import PropTypes from "prop-types";
import { Marker } from "react-map-gl";

import BaseMap from "~/components/views/discovery/mapping/BaseMap";
import CircleMarker from "~/components/views/discovery/mapping/CircleMarker";

class DiscoveryMap extends React.Component {
  renderMapMarker = markerData => {
    console.log(markerData);
    const name = markerData.name;
    const lat = parseFloat(markerData.lat);
    const lng = parseFloat(markerData.lng);
    const pointCount = markerData.sample_ids.length;
    const minSize = 12;
    // Scale based on the zoom and point count (zoomed-in = higher zoom)
    // Log1.5 of the count looked nice visually for not getting too large with many points.
    // const markerSize = Math.max(
    //   Math.log(pointCount) / Math.log(1.5) * (get("zoom", viewport) || 3),
    //   minSize
    // );

    return (
      <Marker key={`marker-${markerData.id}`} latitude={lat} longitude={lng}>
        <CircleMarker
          size={20}
          // onMouseEnter={() =>
          //   this.handleMarkerMouseEnter({ lat, lng, name, pointCount })
          // }
          // onMouseLeave={this.handleMarkerMouseLeave}
        />
      </Marker>
    );
  };

  render() {
    const { mapTilerKey, mapLocationData } = this.props;

    return (
      <BaseMap
        mapTilerKey={mapTilerKey}
        markers={Object.values(mapLocationData).map(this.renderMapMarker)}
      />
    );
  }
}

DiscoveryMap.propTypes = {
  mapTilerKey: PropTypes.string,
  mapLocationData: PropTypes.object
};

export default DiscoveryMap;
