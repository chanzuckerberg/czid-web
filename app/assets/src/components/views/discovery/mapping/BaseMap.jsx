import React from "react";
import PropTypes from "prop-types";
import MapGL, { NavigationControl } from "react-map-gl";

import { limitToRange } from "~/components/utils/format";
import cs from "./base_map.scss";

// MapTiler map name: "2019-06-04"
export const MAP_STYLE_ID = "e65c2178-ffbd-4e9a-bbeb-1250a61bd01b";

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
        zoom,
      },
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
          // Style prop applies to the container and all overlays
          style={{ position: "absolute" }}
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
  popups: PropTypes.array,
};

BaseMap.defaultProps = {
  width: "100%",
  height: "100%",
  // Frame most of the world by default
  latitude: 27,
  longitude: 0,
  zoom: 1.4,
  viewBounds: {
    // Limit panning too far north or south
    minLatitude: -60,
    maxLatitude: 60,
    minLongitude: -180,
    maxLongitude: 180,
    // Limit to whole-world view
    minZoom: 0.5,
    // Limit to city-level at most
    maxZoom: 17,
  },
};

export default BaseMap;
