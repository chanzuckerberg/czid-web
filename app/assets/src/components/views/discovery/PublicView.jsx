import React from "react";
import DiscoveryView from "./DiscoveryView";
import PropTypes from "prop-types";
import { DISCOVERY_DOMAIN_PUBLIC } from "./discovery_api";

class PublicView extends React.Component {
  render() {
    return (
      <DiscoveryView
        domain={DISCOVERY_DOMAIN_PUBLIC}
        allowedFeatures={this.props.allowedFeatures}
      />
    );
  }
}

PublicView.propTypes = {
  allowedFeatures: PropTypes.arrayOf(PropTypes.string)
};

export default PublicView;
