import React from "react";
import { Marker } from "react-map-gl";
import { get } from "lodash/fp";

import PropTypes from "~/components/utils/propTypes";
import BaseMap from "~/components/views/discovery/mapping/BaseMap";
import CircleMarker from "~/components/views/discovery/mapping/CircleMarker";
import MapTooltip from "~/components/views/discovery/mapping/MapTooltip";

export const TOOLTIP_TIMEOUT_MS = 1000;

class DiscoveryMap extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      tooltip: null,
      tooltipShouldClose: false
    };
  }

  updateViewport = viewport => {
    this.setState({ viewport });
  };

  handleMarkerClick = markerData => {
    const { onMarkerClick } = this.props;
    onMarkerClick && onMarkerClick(markerData);
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
        onTitleClick={() => this.handleTooltipTitleClick(hoverInfo)}
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

  handleTooltipTitleClick = hoverInfo => {
    const { onTooltipTitleClick } = this.props;
    onTooltipTitleClick && onTooltipTitleClick(hoverInfo.id);
  };

  renderMarker = markerData => {
    const { viewport } = this.state;
    const id = markerData.id;
    const name = markerData.name;
    const lat = parseFloat(markerData.lat);
    const lng = parseFloat(markerData.lng);
    const pointCount = markerData.sample_ids.length;
    const minSize = 12;
    // Scale based on the zoom and point count (zoomed-in = higher zoom)
    // Log1.5 of the count looked nice visually for not getting too large with many points.
    const markerSize = Math.max(
      Math.log(pointCount) / Math.log(1.5) * (get("zoom", viewport) || 3),
      minSize
    );

    return (
      <Marker key={`marker-${markerData.id}`} latitude={lat} longitude={lng}>
        <CircleMarker
          size={markerSize}
          onClick={() => this.handleMarkerClick(id)}
          onMouseEnter={() =>
            this.handleMarkerMouseEnter({ id, name, lat, lng, pointCount })
          }
          onMouseLeave={this.handleMarkerMouseLeave}
        />
      </Marker>
    );
  };

  render() {
    const { mapTilerKey, mapLocationData } = this.props;
    const { tooltip } = this.state;

    return (
      <BaseMap
        mapTilerKey={mapTilerKey}
        updateViewport={this.updateViewport}
        markers={Object.values(mapLocationData).map(this.renderMarker)}
        tooltip={tooltip}
      />
    );
  }
}

DiscoveryMap.propTypes = {
  mapTilerKey: PropTypes.string,
  mapLocationData: PropTypes.objectOf(PropTypes.Location),
  onMarkerClick: PropTypes.func,
  onTooltipTitleClick: PropTypes.func
};

export default DiscoveryMap;
