import React from "react";
import DiscoveryView from "./DiscoveryView";
import PropTypes from "prop-types";
import { DISCOVERY_DOMAIN_LIBRARY } from "./discovery_api";

class LibraryView extends React.Component {
  render() {
    return (
      <DiscoveryView
        domain={DISCOVERY_DOMAIN_LIBRARY}
        allowedFeatures={this.props.allowedFeatures}
      />
    );
  }
}

LibraryView.propTypes = {
  allowedFeatures: PropTypes.arrayOf(PropTypes.string)
};

export default LibraryView;
