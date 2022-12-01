import { get } from "lodash/fp";
import React from "react";
import { Marker } from "react-map-gl";

import BaseMap from "~/components/views/discovery/mapping/BaseMap";
import CircleMarker from "~/components/views/discovery/mapping/CircleMarker";
import MapTooltip from "~/components/views/discovery/mapping/MapTooltip";
import GeoSearchInputBox from "~ui/controls/GeoSearchInputBox";

import cs from "./map_playground.scss";

export const TOOLTIP_TIMEOUT_MS = 1000;

interface MapPlaygroundProps {
  results?: {
    location_validated_value: {
      id: number;
      lat: string;
      lng: string;
      name: string;
    };
    name: string;
    id: number;
  }[];
  // Access tokens safe for clients
  mapTilerKey?: string;
}

interface MapPlaygroundState {
  locationsToItems: $TSFixMeUnknown;
  viewport: $TSFixMeUnknown;
  tooltip?: $TSFixMeUnknown;
  tooltipShouldClose: boolean;
  searchResult?: $TSFixMeUnknown;
}

class MapPlayground extends React.Component<
  MapPlaygroundProps,
  MapPlaygroundState
> {
  constructor(props) {
    super(props);
    const { results } = this.props;

    // Load demo data as location objects with list of sample entry items
    const locationsToItems = {};
    results.forEach(result => {
      const locData = result.location_validated_value;
      const locId = locData.id;
      const item = {
        sampleName: result.name,
        sampleId: result.id,
      };
      if (locationsToItems[locId]) {
        locationsToItems[locId].items.push(item);
      } else {
        locationsToItems[locId] = {
          lat: parseFloat(locData.lat),
          lng: parseFloat(locData.lng),
          name: locData.name,
          items: [item],
        };
      }
    });

    this.state = {
      locationsToItems: locationsToItems,
      viewport: {},
      tooltip: null,
      tooltipShouldClose: false,
      searchResult: null,
    };
  }

  updateViewport = viewport => {
    this.setState({ viewport });
  };

  renderMarker = (marker, index) => {
    const { viewport } = this.state;
    const markerData = marker[1];
    const name = markerData.name;
    const lat = markerData.lat;
    const lng = markerData.lng;
    const pointCount = markerData.items.length;
    const minSize = 12;
    // Scale based on the zoom and point count (zoomed-in = higher zoom)
    // Log1.5 of the count looked nice visually for not getting too large with many points.
    const markerSize = Math.max(
      (Math.log(pointCount) / Math.log(1.5)) * (get("zoom", viewport) || 3),
      minSize,
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

  handleSearchResultSelected = ({ result }) => {
    this.setState({ searchResult: result });
  };

  render() {
    const { mapTilerKey } = this.props;
    const { locationsToItems, tooltip, searchResult } = this.state;

    return (
      <div>
        <div className={cs.container}>
          <div className={cs.title}>Location entry demo:</div>
          <GeoSearchInputBox onResultSelect={this.handleSearchResultSelected} />
          {searchResult && `Selected: ${JSON.stringify(searchResult)}`}
        </div>
        <div className={cs.container}>
          <div className={cs.title}>Map display demo:</div>
          <BaseMap
            mapTilerKey={mapTilerKey}
            updateViewport={this.updateViewport}
            tooltip={tooltip}
            markers={Object.entries(locationsToItems).map(this.renderMarker)}
            width={1250}
            height={1000}
          />
        </div>
      </div>
    );
  }
}

export default MapPlayground;
