import React from "react";
import PropTypes from "prop-types";
import MapGL, { Marker } from "react-map-gl";
import axios from "axios";

import cs from "./map_playground.scss";
import { Icon } from "semantic-ui-react";

class MapPlayground extends React.Component {
  state = {
    viewport: {
      width: 1000,
      height: 1000,
      latitude: 37.7577,
      longitude: -122.4376,
      zoom: 8
    }
  };

  constructor(props) {
    super(props);
    window.unwired.key = props.locationIQKey;
  }

  componentWillMount() {
    const { locations } = this.props;
    let toDisplay = [];
    locations.forEach(loc => {
      if (/\d/.test(loc)) {
        loc = loc.replace(/_/g, ", ");
        const [lat, lon] = loc.split(", ");
        const formatted = {
          name: loc,
          latitude: parseFloat(lat),
          longitude: parseFloat(lon)
        };
        toDisplay.push(formatted);
      }
    });

    this.setState({ toDisplay });
  }

  geosearch(query) {
    const key = this.props.locationIQKey;
    axios
      .get(
        `https://us1.locationiq.com/v1/search.php?key=${key}&format=json&addressdetails=1&normalizecity=1&q=${query}`
      )
      .then(resp => {
        const searchResults = resp.data;
        if (searchResults.length > 0) {
          const result = searchResults[0];
          return {
            name: result["display_name"],
            latitude: result["lat"],
            longitude: result["lon"]
          };
        }
      })
      .catch(err => {
        console.log(err);
      });
  }

  renderMarker = (sample, index) => {
    return (
      <Marker
        key={`marker-${index}`}
        longitude={sample.longitude}
        latitude={sample.latitude}
      >
        <Icon size="small" name="bug" />
      </Marker>
    );
  };

  render() {
    return (
      <div>
        {this.props.locations}
        <div className={cs.mapContainer}>
          <MapGL
            {...this.state.viewport}
            onViewportChange={viewport => this.setState({ viewport })}
            mapStyle={window.unwired.getLayer("streets")}
          >
            {this.state.toDisplay.map(this.renderMarker)}
          </MapGL>
        </div>
      </div>
    );
  }
}

MapPlayground.propTypes = {
  locations: PropTypes.array,
  locationIQKey: PropTypes.string
};

export default MapPlayground;
