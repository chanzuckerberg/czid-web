import { get, throttle, upperFirst, size, map, uniq, flatten } from "lodash/fp";
import React from "react";

import { trackEvent } from "~/api/analytics";
import PropTypes from "~/components/utils/propTypes";
import BaseMap from "~/components/views/discovery/mapping/BaseMap";
import MapBanner from "~/components/views/discovery/mapping/MapBanner";
import MapTooltip from "~/components/views/discovery/mapping/MapTooltip";
import ShapeMarker from "~/components/views/discovery/mapping/ShapeMarker";
import { MAP_CLUSTER_ENABLED_LEVELS } from "~/components/views/discovery/mapping/constants";
import {
  indexOfMapLevel,
  isValidCoordinate,
} from "~/components/views/discovery/mapping/utils";

export const TOOLTIP_TIMEOUT_MS = 1000;
export const DEFAULT_THROTTLE_MS = 500;

class DiscoveryMap extends React.Component {
  constructor(props) {
    super(props);
    const { onMapLevelChange } = this.props;

    this.state = {
      tooltip: null,
      tooltipShouldClose: false,
    };

    // By default throttle includes the trailing event
    this.trackEventThrottled = throttle(DEFAULT_THROTTLE_MS, trackEvent);
    if (onMapLevelChange) {
      this.onMapLevelChangeThrottled = throttle(
        DEFAULT_THROTTLE_MS,
        onMapLevelChange,
      );
    }
  }

  // updateViewport fires many times a second when moving, so we can throttle event calls.
  updateViewport = viewport => {
    const { zoomBoundaryCountry, zoomBoundaryState } = this.props;

    this.setState({ viewport });

    if (this.onMapLevelChangeThrottled) {
      const level =
        viewport.zoom < zoomBoundaryCountry
          ? "country"
          : viewport.zoom < zoomBoundaryState
          ? "state"
          : "city";
      this.onMapLevelChangeThrottled(level);
    }

    this.trackEventThrottled("DiscoveryMap_viewport_updated");
  };

  handleMarkerClick = locationId => {
    const { onMarkerClick } = this.props;
    onMarkerClick && onMarkerClick(locationId);
    trackEvent("DiscoveryMap_marker_clicked", { locationId });
  };

  handleMarkerMouseEnter = locationInfo => {
    const { currentTab } = this.props;

    // ex: samples -> Sample
    const noun = upperFirst(currentTab).slice(0, -1);
    const title = `${locationInfo.pointCount} ${noun}${
      locationInfo.pointCount > 1 ? "s" : ""
    }`;
    const tooltip = (
      <MapTooltip
        lat={locationInfo.lat}
        lng={locationInfo.lng}
        title={title}
        body={locationInfo.name}
        onMouseEnter={this.handleTooltipMouseEnter}
        onMouseLeave={this.handleMarkerMouseLeave}
        onTitleClick={() => this.handleTooltipTitleClick(locationInfo)}
      />
    );
    this.setState({ tooltip, tooltipShouldClose: false });

    trackEvent("DiscoveryMap_marker_hovered", {
      locationId: locationInfo.id,
    });
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

  handleTooltipTitleClick = locationInfo => {
    const { onTooltipTitleClick } = this.props;
    onTooltipTitleClick && onTooltipTitleClick(locationInfo.id);

    trackEvent("DiscoveryMap_tooltip-title_clicked", {
      locationId: locationInfo.id,
    });
  };

  handleMapClick = () => {
    const { onClick } = this.props;
    onClick && onClick();
    trackEvent("DiscoveryMap_blank-area_clicked");
  };

  renderMarker = locationInfo => {
    const { currentTab, mapLevel, previewedLocationId } = this.props;
    const { viewport } = this.state;

    const id = locationInfo.id;
    const name = locationInfo.name;
    const lat = parseFloat(locationInfo.lat);
    const lng = parseFloat(locationInfo.lng);
    // Catch NaN/invalid coordinates although this should not happen.
    if (!isValidCoordinate(lat, lng)) {
      // eslint-disable-next-line no-console
      console.error(`Invalid coordinates for ${name} (${id})`);
      return null;
    }

    const geoLevel = locationInfo.geo_level;

    const idsField = currentTab === "samples" ? "sample_ids" : "project_ids";
    if (!locationInfo[idsField]) return;

    const pointCount = locationInfo[idsField].length;
    const rectangular =
      MAP_CLUSTER_ENABLED_LEVELS.includes(geoLevel) &&
      indexOfMapLevel(geoLevel) < indexOfMapLevel(mapLevel);

    return (
      <ShapeMarker
        active={id === previewedLocationId}
        id={id}
        key={`marker-${locationInfo.id}`}
        lat={lat}
        lng={lng}
        onClick={() => this.handleMarkerClick(id)}
        onMouseEnter={() =>
          this.handleMarkerMouseEnter({ id, name, lat, lng, pointCount })
        }
        onMouseLeave={this.handleMarkerMouseLeave}
        pointCount={pointCount}
        rectangular={rectangular}
        title={`${name} (${pointCount})`}
        zoom={get("zoom", viewport)}
      />
    );
  };

  renderBanner = () => {
    const { currentTab, mapLocationData, onClearFilters } = this.props;
    const idsField = currentTab === "samples" ? "sample_ids" : "project_ids";
    // De-dup ids so you don't double-count
    const itemCount = size(uniq(flatten(map(idsField, mapLocationData))));
    return (
      <MapBanner
        item={currentTab}
        itemCount={itemCount}
        onClearFilters={onClearFilters}
      />
    );
  };

  render() {
    const { mapTilerKey, mapLocationData } = this.props;
    const { tooltip } = this.state;

    return (
      <BaseMap
        banner={this.renderBanner()}
        mapTilerKey={mapTilerKey}
        markers={
          mapLocationData &&
          Object.values(mapLocationData).map(this.renderMarker)
        }
        onClick={this.handleMapClick}
        tooltip={tooltip}
        updateViewport={this.updateViewport}
      />
    );
  }
}

// Zoom boundaries determined via eyeballing.
DiscoveryMap.defaultProps = {
  currentTab: "samples",
  zoomBoundaryCountry: 3.5,
  zoomBoundaryState: 5,
};

DiscoveryMap.propTypes = {
  currentDisplay: PropTypes.string,
  currentTab: PropTypes.string.isRequired,
  mapLevel: PropTypes.string,
  mapLocationData: PropTypes.objectOf(PropTypes.Location),
  mapTilerKey: PropTypes.string,
  onClearFilters: PropTypes.func,
  onClick: PropTypes.func,
  onMapLevelChange: PropTypes.func,
  onMarkerClick: PropTypes.func,
  onTooltipTitleClick: PropTypes.func,
  previewedLocationId: PropTypes.number,
  zoomBoundaryCountry: PropTypes.number,
  zoomBoundaryState: PropTypes.number,
};

export default DiscoveryMap;
