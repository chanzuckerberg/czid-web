import React from "react";
import { Marker } from "react-map-gl";
import { get, indexOf, isEmpty, throttle, upperFirst } from "lodash/fp";

import { logAnalyticsEvent, withAnalytics } from "~/api/analytics";
import PropTypes from "~/components/utils/propTypes";
import BaseMap from "~/components/views/discovery/mapping/BaseMap";
import { MAP_LEVEL_ORDER } from "~/components/views/discovery/mapping/constants";
import CircleMarker from "~/components/views/discovery/mapping/CircleMarker";
import MapTooltip from "~/components/views/discovery/mapping/MapTooltip";
import RectangleMarker from "~/components/views/discovery/mapping/RectangleMarker";

import cs from "./discovery_map.scss";

export const TOOLTIP_TIMEOUT_MS = 1000;
export const DEFAULT_THROTTLE_MS = 500;

class DiscoveryMap extends React.Component {
  constructor(props) {
    super(props);
    const { onLevelChange } = this.props;

    this.state = {
      tooltip: null,
      tooltipShouldClose: false,
    };

    // By default throttle includes the trailing event
    this.logAnalyticsEventThrottled = throttle(
      DEFAULT_THROTTLE_MS,
      logAnalyticsEvent
    );
    if (onLevelChange) {
      this.onLevelChangeThrottled = throttle(
        DEFAULT_THROTTLE_MS,
        onLevelChange
      );
    }
  }

  // updateViewport fires many times a second, so we can throttle event calls.
  updateViewport = viewport => {
    this.setState({ viewport });

    if (this.onLevelChangeThrottled) {
      const level =
        viewport.zoom < 4 ? "country" : viewport.zoom < 5.5 ? "state" : "city";
      this.onLevelChangeThrottled(level);
    }

    this.logAnalyticsEventThrottled("DiscoveryMap_viewport_updated");
  };

  handleMarkerClick = locationId => {
    const { onMarkerClick } = this.props;
    onMarkerClick && onMarkerClick(locationId);
    logAnalyticsEvent("DiscoveryMap_marker_clicked", { locationId });
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

    logAnalyticsEvent("DiscoveryMap_marker_hovered", {
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

    logAnalyticsEvent("DiscoveryMap_tooltip-title_clicked", {
      locationId: locationInfo.id,
    });
  };

  handleMapClick = () => {
    const { onClick } = this.props;
    onClick && onClick();
    logAnalyticsEvent("DiscoveryMap_blank-area_clicked");
  };

  renderMarker = locationInfo => {
    const { currentTab, level, previewedLocationId } = this.props;
    const { viewport } = this.state;
    const id = locationInfo.id;
    const name = locationInfo.name;
    const lat = parseFloat(locationInfo.lat);
    const lng = parseFloat(locationInfo.lng);

    const idsField = currentTab === "samples" ? "sample_ids" : "project_ids";
    if (!locationInfo[idsField]) return;

    const pointCount = locationInfo[idsField].length;
    const minSize = 10;
    // Scale based on the zoom and point count (zoomed-in = higher zoom)
    // Log1.5 of the count looked nice visually for not getting too large with many points.
    const markerSize = Math.max(
      Math.log(pointCount) / Math.log(1.4) * (get("zoom", viewport) || 3),
      minSize
    );

    const shapeMarkers = {
      circle: RectangleMarker,
      rectangle: RectangleMarker,
    };
    let ShapeMarker = shapeMarkers["circle"];

    if (
      indexOf(locationInfo.geo_level, MAP_LEVEL_ORDER) <
      indexOf(level, MAP_LEVEL_ORDER)
    ) {
      if (["country", "state"].includes(locationInfo.geo_level)) {
        ShapeMarker = shapeMarkers["rectangle"];
      }
    }

    return (
      <Marker key={`marker-${locationInfo.id}`} latitude={lat} longitude={lng}>
        <ShapeMarker
          active={id === previewedLocationId}
          size={markerSize}
          onClick={() => this.handleMarkerClick(id)}
          onMouseEnter={() =>
            this.handleMarkerMouseEnter({ id, name, lat, lng, pointCount })
          }
          onMouseLeave={this.handleMarkerMouseLeave}
          title={`${name} (${pointCount})`}
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
            <span
              className={cs.clearAll}
              onClick={withAnalytics(
                onClearFilters,
                "DiscoveryMap_clear-filters-link_clicked",
                {
                  currentTab,
                }
              )}
            >
              Clear all
            </span>
          </div>
        </div>
      );
    }
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

DiscoveryMap.defaultProps = {
  currentTab: "samples",
};

DiscoveryMap.propTypes = {
  currentDisplay: PropTypes.string,
  currentTab: PropTypes.string.isRequired,
  level: PropTypes.string,
  mapLocationData: PropTypes.objectOf(PropTypes.Location),
  mapTilerKey: PropTypes.string,
  onClearFilters: PropTypes.func,
  onClick: PropTypes.func,
  onLevelChange: PropTypes.func,
  onMarkerClick: PropTypes.func,
  onTooltipTitleClick: PropTypes.func,
  previewedLocationId: PropTypes.number,
};

export default DiscoveryMap;
