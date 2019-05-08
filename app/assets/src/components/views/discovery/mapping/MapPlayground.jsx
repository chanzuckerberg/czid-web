import React from "react";
import PropTypes from "prop-types";
import { Marker } from "react-map-gl";
import { get } from "lodash/fp";

import { getGeoSearchSuggestions } from "~/api/locations";
import LiveSearchBox from "~ui/controls/LiveSearchBox";
import BaseMap from "~/components/views/discovery/mapping/BaseMap";
import CircleMarker from "~/components/views/discovery/mapping/CircleMarker";
import MapTooltip from "~/components/views/discovery/mapping/MapTooltip";

import cs from "./map_playground.scss";

export const TOOLTIP_TIMEOUT_MS = 1000;

class MapPlayground extends React.Component {
  constructor(props) {
    super(props);
    const { results } = this.props;

    // Load demo data as locations->samples
    const locationsToItems = {};
    results.forEach(result => {
      // Match locations that look like coordinates separated by a comma
      let locationName = result.location.replace(/_/g, ", ");
      const match = /^([-0-9.]+),\s?([-0-9.]+)$/g.exec(locationName);
      if (match) {
        let [lat, lng] = this.parseLatLng(match[1], match[2]);
        if (!(lat && lng)) return;
        locationName = `${lat}, ${lng}`;
        const item = {
          name: result.name,
          id: result.id
        };

        // Group items under the location name
        if (locationsToItems.hasOwnProperty(locationName)) {
          locationsToItems[locationName].items.push(item);
        } else {
          locationsToItems[locationName] = {
            lat: lat,
            lng: lng,
            items: [item]
          };
        }
      }
    });

    this.state = {
      locationsToItems: locationsToItems,
      viewport: {},
      tooltip: null,
      tooltipShouldClose: false
    };
  }

  parseLatLng = (lat, lng) => {
    // Round the coordinates for some minimal aggregation
    lat = parseFloat(parseFloat(lat).toFixed(2));
    lng = parseFloat(parseFloat(lng).toFixed(2));
    // Reject invalid coordinates
    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      // eslint-disable-next-line no-console
      console.log(`Skipping invalid coordinates ${lat}, ${lng}`);
      return [null, null];
    } else {
      return [lat, lng];
    }
  };

  updateViewport = viewport => {
    this.setState({ viewport });
  };

  renderMarker = (marker, index) => {
    const { viewport } = this.state;
    const [name, markerData] = marker;
    const lat = markerData.lat;
    const lng = markerData.lng;
    const pointCount = markerData.items.length;
    const minSize = 12;
    // Scale based on the zoom and point count (zoomed-in = higher zoom)
    // Log1.5 of the count looked nice visually for not getting too large with many points.
    const markerSize = Math.max(
      Math.log(pointCount) / Math.log(1.5) * (get("zoom", viewport) || 3),
      minSize
    );

    return (
      <Marker key={`marker-${index}`} latitude={lat} longitude={lng}>
        <CircleMarker
          size={markerSize}
          onMouseEnter={() =>
            this.handleMarkerMouseEnter({ lat, lng, name, pointCount })
          }
          onMouseLeave={this.handleMarkerMouseLeave}
        />
      </Marker>
    );
  };

  handleMarkerMouseEnter = hoverInfo => {
    const title = `${hoverInfo.pointCount} Sample${
      hoverInfo.pointCount > 1 ? "s" : ""
    }`;
    const tooltip = (
      <MapTooltip
        lat={hoverInfo.lat}
        lng={hoverInfo.lng}
        title={title}
        body={hoverInfo.name}
        onMouseEnter={this.handleTooltipMouseEnter}
        onMouseLeave={this.handleMarkerMouseLeave}
      />
    );
    this.setState({ tooltip, tooltipShouldClose: false });
  };

  handleMarkerMouseLeave = () => {
    // Flag the tooltip to close after a timeout, which could be unflagged by another event (entering a marker or tooltip).
    this.setState({ tooltipShouldClose: true });
    setTimeout(() => {
      const { tooltipShouldClose } = this.state;
      tooltipShouldClose && this.setState({ tooltip: null });
    }, TOOLTIP_TIMEOUT_MS);
  };

  handleTooltipMouseEnter = () => {
    this.setState({ tooltipShouldClose: false });
  };

  handleSearchTriggered = async query => {
    const serverSideSuggestions = await getGeoSearchSuggestions(query);
    console.log(serverSideSuggestions);
    return serverSideSuggestions;
  };

  render() {
    const { mapTilerKey } = this.props;
    const { locationsToItems, tooltip } = this.state;

    return (
      <div>
        <div className={cs.searchContainer}>
          <LiveSearchBox
            onSearchTriggered={this.handleSearchTriggered}
            // onResultSelect={this.handleSearchResultSelected}
            // onEnter={this.handleSearchEnterPressed}
            placeholder="Search"
            hasCategories={false}
          />
        </div>
        <BaseMap
          mapTilerKey={mapTilerKey}
          updateViewport={this.updateViewport}
          tooltip={tooltip}
          markers={Object.entries(locationsToItems).map(this.renderMarker)}
        />
      </div>
    );
  }
}

MapPlayground.propTypes = {
  results: PropTypes.array,
  // Access tokens safe for clients
  mapTilerKey: PropTypes.string
};

export default MapPlayground;
