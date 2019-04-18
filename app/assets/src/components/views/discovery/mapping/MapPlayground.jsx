import React from "react";
import PropTypes from "prop-types";
import { Marker, Popup as MapPopup } from "react-map-gl";
import { get, remove } from "lodash/fp";

import BaseMap from "~/components/views/discovery/mapping/BaseMap";
import CircleMarker from "~/components/views/discovery/mapping/CircleMarker";
import CheckmarkIcon from "../../../ui/icons/CheckmarkIcon";

class MapPlayground extends React.Component {
  constructor(props) {
    super(props);

    // Load demo data as locations->samples
    const { results } = this.props;
    const locationsToSamples = {};
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

    this.state = {
      locationsToSamples,
      viewport: {},
      popups: []
    };
  }

  updateViewport = viewport => {
    this.setState({ viewport });
  };

  renderMarker = (markerData, index) => {
    const { viewport } = this.state;
    const [lat, lon] = markerData[0].split(",");
    const pointCount = markerData[1].length;
    const minSize = 14;
    // Scale based on the zoom and point count (zoomed-in = higher zoom)
    const markerSize = Math.max(
      pointCount * (get("zoom", viewport) || 3),
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
          onClick={() =>
            this.openPopup({
              latitude: parseFloat(lat),
              longitude: parseFloat(lon),
              markerIndex: index
            })
          }
        />
      </Marker>
    );
  };

  openPopup(popupInfo) {
    const popups = Object.assign([], this.state.popups);
    popups.push(popupInfo);
    this.setState({ popups });
  }

  closePopup(popupInfo) {
    let popups = Object.assign([], this.state.popups);
    popups = remove({ markerIndex: popupInfo.markerIndex }, popups);
    this.setState({ popups });
  }

  renderPopupBox = popupInfo => {
    return (
      <MapPopup
        anchor="left"
        latitude={popupInfo.latitude}
        longitude={popupInfo.longitude}
        onClose={() => this.closePopup(popupInfo)}
      >
        <div>
          <CheckmarkIcon />
        </div>
      </MapPopup>
    );
  };

  render() {
    const { mapTilerKey } = this.props;
    const { locationsToSamples, popups } = this.state;

    return (
      <BaseMap
        mapTilerKey={mapTilerKey}
        updateViewport={this.updateViewport}
        markers={Object.entries(locationsToSamples)}
        renderMarker={this.renderMarker}
        popups={popups}
        renderPopup={this.renderPopupBox}
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
