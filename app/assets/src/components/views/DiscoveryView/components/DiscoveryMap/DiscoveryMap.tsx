import { flatten, get, map, size, throttle, uniq, upperFirst } from "lodash/fp";
import React from "react";
import { EventData, TrackEventType, useTrackEvent } from "~/api/analytics";
import BaseMap from "~/components/views/DiscoveryView/components/DiscoveryMap/components/BaseMap/BaseMap";
import MapBanner from "~/components/views/DiscoveryView/components/DiscoveryMap/components/MapBanner/MapBanner";
import MapTooltip from "~/components/views/DiscoveryView/components/DiscoveryMap/components/MapTooltip/MapTooltip";
import ShapeMarker from "~/components/views/DiscoveryView/components/DiscoveryMap/components/ShapeMarker/ShapeMarker";
import { MAP_CLUSTER_ENABLED_LEVELS } from "~/components/views/DiscoveryView/components/DiscoveryMap/constants";
import {
  indexOfMapLevel,
  isValidCoordinate,
} from "~/components/views/DiscoveryView/components/DiscoveryMap/utils";

export const TOOLTIP_TIMEOUT_MS = 1000;
export const DEFAULT_THROTTLE_MS = 500;

interface DiscoveryMapProps {
  currentDisplay?: string;
  currentTab: string;
  mapLevel?: string;
  mapLocationData?: Record<string, unknown>;
  mapTilerKey?: string;
  onClearFilters?: $TSFixMeFunction;
  onClick?: $TSFixMeFunction;
  onMapLevelChange?: $TSFixMeFunction;
  onMarkerClick?: $TSFixMeFunction;
  onTooltipTitleClick?: $TSFixMeFunction;
  previewedLocationId?: number;
  zoomBoundaryCountry?: number;
  zoomBoundaryState?: number;
}

interface DiscoveryMapWithContextProps extends DiscoveryMapProps {
  trackEvent: TrackEventType;
}

interface DiscoveryMapState {
  tooltip?: React.ReactNode;
  tooltipShouldClose: boolean;
  viewport?: $TSFixMeUnknown;
}

class DiscoveryMapCC extends React.Component<
  DiscoveryMapWithContextProps,
  DiscoveryMapState
> {
  onMapLevelChangeThrottled: $TSFixMe;
  trackEventThrottled: $TSFixMe;
  constructor(props: DiscoveryMapWithContextProps) {
    super(props);
    const { onMapLevelChange } = this.props;

    this.state = {
      tooltip: null,
      tooltipShouldClose: false,
    };

    // By default throttle includes the trailing event
    this.trackEventThrottled = throttle(
      DEFAULT_THROTTLE_MS,
      (eventName: string, eventData: EventData) =>
        this.props.trackEvent(eventName, eventData),
    );
    if (onMapLevelChange) {
      this.onMapLevelChangeThrottled = throttle(
        DEFAULT_THROTTLE_MS,
        onMapLevelChange,
      );
    }
  }

  // updateViewport fires many times a second when moving, so we can throttle event calls.
  updateViewport = (viewport: $TSFixMe) => {
    const { zoomBoundaryCountry, zoomBoundaryState } = this.props;

    this.setState({ viewport });

    if (this.onMapLevelChangeThrottled) {
      const level =
        // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2532
        viewport.zoom < zoomBoundaryCountry
          ? "country"
          : // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2532
          viewport.zoom < zoomBoundaryState
          ? "state"
          : "city";
      this.onMapLevelChangeThrottled(level);
    }

    this.trackEventThrottled("DiscoveryMap_viewport_updated");
  };

  handleMarkerClick = (locationId: $TSFixMe) => {
    const { onMarkerClick } = this.props;
    onMarkerClick && onMarkerClick(locationId);
  };

  handleMarkerMouseEnter = (locationInfo: $TSFixMe) => {
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

  handleTooltipTitleClick = (locationInfo: $TSFixMe) => {
    const { onTooltipTitleClick } = this.props;
    onTooltipTitleClick && onTooltipTitleClick(locationInfo.id);
  };

  handleMapClick = () => {
    const { onClick } = this.props;
    onClick && onClick();
  };

  renderMarker = (locationInfo: $TSFixMe) => {
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
      // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2345
      indexOfMapLevel(geoLevel) < indexOfMapLevel(mapLevel);

    return (
      <ShapeMarker
        active={id === previewedLocationId}
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
        // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2322
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
// @ts-expect-error ts-migrate(2339) FIXME: Property 'defaultProps' does not exist on type 'ty... Remove this comment to see the full error message
DiscoveryMapCC.defaultProps = {
  currentTab: "samples",
  zoomBoundaryCountry: 3.5,
  zoomBoundaryState: 5,
};

// Using a function component wrapper provides a semi-hacky way to
// access useContext from multiple providers without the class component to function component
// conversion.
export const DiscoveryMap = (props: DiscoveryMapProps) => {
  const trackEvent = useTrackEvent();

  return <DiscoveryMapCC {...props} trackEvent={trackEvent} />;
};
