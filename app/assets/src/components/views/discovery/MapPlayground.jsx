import React from "react";
import PropTypes from "prop-types";
import MapGL, { Marker } from "react-map-gl";
import axios from "axios";

import { get } from "~/api/core";
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
    // From their website demo
    window.unwired.key = props.mapKey;
  }

  componentWillMount() {
    const { results: given } = this.props;
    console.log(given);
    let newResults = [];
    given.forEach(loc => {
      if (/\d/.test(loc)) {
        loc = loc.replace(/_/g, ", ");
        const [lat, lon] = loc.split(", ");
        const formatted = {
          name: loc,
          latitude: parseFloat(lat),
          longitude: parseFloat(lon)
        };
        newResults.push(formatted);
      }
    });

    console.log(newResults);
    this.setState({ toDisplay: newResults });
  }

  geosearch(query) {
    axios
      .get(
        `https://us1.locationiq.com/v1/search.php?key=${
          this.props.searchKey
        }&format=json&addressdetails=1&normalizecity=1&q=${query}`
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
        {this.props.results}
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
  results: PropTypes.array
};

export default MapPlayground;
