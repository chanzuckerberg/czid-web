import React from "react";
import { Marker } from "react-map-gl";
import { get, isEmpty, upperFirst } from "lodash/fp";

import PropTypes from "~/components/utils/propTypes";
import BaseMap from "~/components/views/discovery/mapping/BaseMap";
import CircleMarker from "~/components/views/discovery/mapping/CircleMarker";
import MapTooltip from "~/components/views/discovery/mapping/MapTooltip";

import cs from "./discovery_map.scss";

export const TOOLTIP_TIMEOUT_MS = 1000;

class DiscoveryMap extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      tooltip: null,
      tooltipShouldClose: false,
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
    const { currentTab } = this.props;

    // ex: samples -> Sample
    const noun = upperFirst(currentTab).slice(0, -1);
    const title = `${hoverInfo.pointCount} ${noun}${
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
    const { currentTab, previewedLocationId } = this.props;
    const { viewport } = this.state;
    const id = markerData.id;
    const name = markerData.name;
    const lat = parseFloat(markerData.lat);
    const lng = parseFloat(markerData.lng);
    const idsField = currentTab === "samples" ? "sample_ids" : "project_ids";
    const pointCount = markerData[idsField] && markerData[idsField].length;
    const minSize = 10;
    // Scale based on the zoom and point count (zoomed-in = higher zoom)
    // Log1.5 of the count looked nice visually for not getting too large with many points.
    const markerSize = Math.max(
      Math.log(pointCount) / Math.log(1.4) * (get("zoom", viewport) || 3),
      minSize
    );

    return (
      <Marker key={`marker-${markerData.id}`} latitude={lat} longitude={lng}>
        <CircleMarker
          active={id === previewedLocationId}
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

  renderBanner = () => {
    const { currentTab, mapLocationData, onClearFilters } = this.props;
    if (isEmpty(mapLocationData)) {
      return (
        <div className={cs.bannerContainer}>
          <div className={cs.banner}>
            {`No ${currentTab} found. Try adjusting search or filters. `}
            <span className={cs.clear} onClick={onClearFilters}>
              Clear search
            </span>
          </div>
        </div>
      );
    }
  };

  render() {
    const { mapTilerKey, mapLocationData, onClick } = this.props;
    const { tooltip } = this.state;
    return (
      <BaseMap
        banner={this.renderBanner()}
        mapTilerKey={mapTilerKey}
        markers={
          mapLocationData &&
          Object.values(mapLocationData).map(this.renderMarker)
        }
        onClick={onClick}
        tooltip={tooltip}
        updateViewport={this.updateViewport}
      />
    );
  }
}

DiscoveryMap.defaultProps = {
  currentTab: "samples",
};

DiscoveryMap.propTypes = {
  currentDisplay: PropTypes.string,
  currentTab: PropTypes.string.isRequired,
  mapLocationData: PropTypes.objectOf(PropTypes.Location),
  mapTilerKey: PropTypes.string,
  onClearFilters: PropTypes.func,
  onClick: PropTypes.func,
  onMarkerClick: PropTypes.func,
  onTooltipTitleClick: PropTypes.func,
  previewedLocationId: PropTypes.number,
};

export default DiscoveryMap;
