import React from "react";
import DiscoveryView from "./DiscoveryView";
import { DISCOVERY_DOMAIN_PUBLIC } from "./discovery_api";

class PublicView extends React.Component {
  render() {
    return <DiscoveryView domain={DISCOVERY_DOMAIN_PUBLIC} />;
  }
}

export default PublicView;
