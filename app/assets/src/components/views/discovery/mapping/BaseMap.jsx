import React from "react";
import PropTypes from "prop-types";
import MapGL, { NavigationControl } from "react-map-gl";

import { limitToRange } from "~/components/utils/format";
import cs from "./base_map.scss";

// MapTiler map name: "2019-04-24"
export const MAP_STYLE_ID = "f0e7922a-43cf-4dc5-b598-17ae1f56d2f4";

class BaseMap extends React.Component {
  constructor(props) {
    super(props);

    const { width, height, latitude, longitude, zoom } = this.props;
    this.state = {
      viewport: {
        width,
        height,
        latitude,
        longitude,
        zoom
      }
    };
  }

  updateViewport = viewport => {
    const { updateViewport, viewBounds, width, height } = this.props;

    // Let width/height update on resize
    viewport.width = width;
    viewport.height = height;
    viewport.latitude = limitToRange(
      viewport.latitude,
      viewBounds.minLatitude,
      viewBounds.maxLatitude
    );
    viewport.longitude = limitToRange(
      viewport.longitude,
      viewBounds.minLongitude,
      viewBounds.maxLongitude
    );
    viewport.zoom = limitToRange(
      viewport.zoom,
      viewBounds.minZoom,
      viewBounds.maxZoom
    );

    this.setState({ viewport }, () => this.setCompactAttribution());
    updateViewport && updateViewport(viewport);
  };

  setCompactAttribution = () => {
    // Show compact attribution tags
    const tag = document.getElementsByClassName("mapboxgl-ctrl-attrib")[0];
    tag && tag.classList.add("mapboxgl-compact");
  };

  render() {
    const { mapTilerKey, tooltip, markers, popups } = this.props;
    const { viewport } = this.state;

    const styleURL = `https://api.maptiler.com/maps/${MAP_STYLE_ID}/style.json?key=${mapTilerKey}`;
    return (
      <div className={cs.mapContainer}>
        <MapGL
          {...viewport}
          onViewportChange={this.updateViewport}
          mapStyle={styleURL}
          onLoad={this.setCompactAttribution}
        >
          {tooltip}
          {markers}
          {popups}

          <NavigationControl
            onViewportChange={this.updateViewport}
            showCompass={false}
            className={cs.zoomControl}
          />
        </MapGL>
      </div>
    );
  }
}

BaseMap.propTypes = {
  mapTilerKey: PropTypes.string.isRequired,
  updateViewport: PropTypes.func,
  width: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  height: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  latitude: PropTypes.number,
  longitude: PropTypes.number,
  zoom: PropTypes.number,
  viewBounds: PropTypes.objectOf(PropTypes.number),
  tooltip: PropTypes.node,
  markers: PropTypes.array,
  popups: PropTypes.array
};

BaseMap.defaultProps = {
  width: "100%",
  height: "100%",
  // United States framed
  latitude: 40,
  longitude: -98,
  zoom: 3,
  // These bounds prevent panning too far north or south, although you will still see those regions at the widest zoom levels. minZoom level frames most of the world. maxZoom level keeps you at an area about the size of a metropolitan area.
  viewBounds: {
    minLatitude: -60,
    maxLatitude: 60,
    minLongitude: -180,
    maxLongitude: 180,
    minZoom: 1.4,
    maxZoom: 12
  }
};

export default BaseMap;
