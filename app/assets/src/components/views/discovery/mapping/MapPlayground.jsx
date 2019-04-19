import React from "react";
import PropTypes from "prop-types";
import { Marker, Popup as MapPopup } from "react-map-gl";
import { get, remove } from "lodash/fp";

import BaseMap from "~/components/views/discovery/mapping/BaseMap";
import CircleMarker from "~/components/views/discovery/mapping/CircleMarker";

import cs from "./map_playground.scss";

class MapPlayground extends React.Component {
  constructor(props) {
    super(props);

    // Load demo data as locations->samples
    const { results } = this.props;
    const locationsToSamples = {};
    results.forEach(result => {
      // Match locations that look like coordinates separated by a comma
      let loc = result.location.replace(/_/g, ", ");
      const match = /^([-0-9.]+),\s?([-0-9.]+)$/g.exec(loc);
      if (match) {
        loc = `${parseFloat(match[1]).toFixed(2)}, ${parseFloat(
          match[2]
        ).toFixed(2)}`;
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
    const minSize = 12;
    const maxSize = 500;
    // Scale based on the zoom and point count (zoomed-in = higher zoom)
    const markerSize = Math.min(
      Math.max(
        Math.log(pointCount) / Math.log(1.5) * (get("zoom", viewport) || 3),
        minSize
      ),
      maxSize
    );
    const hoverContent = (
      <div>
        <div className={cs.title}>{markerData[0]}</div>
        <div className={cs.description}>{`Samples: ${pointCount}`}</div>
      </div>
    );
    const popupInfo = {
      name: markerData[0],
      latitude: parseFloat(lat),
      longitude: parseFloat(lon),
      markerIndex: index,
      samples: markerData[1]
    };
    return (
      <Marker
        key={`marker-${index}`}
        latitude={parseFloat(lat)}
        longitude={parseFloat(lon)}
      >
        <CircleMarker
          size={markerSize}
          hoverContent={hoverContent}
          onClick={() => this.openPopup(popupInfo)}
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
        anchor="bottom"
        tipSize={0}
        latitude={popupInfo.latitude}
        longitude={popupInfo.longitude}
        onClose={() => this.closePopup(popupInfo)}
        className={cs.dataBox}
      >
        <div>
          <div className={cs.title}>{popupInfo.name}</div>
          {popupInfo.samples.map(sample => (
            <div className={cs.description}>{sample.name}</div>
          ))}
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
