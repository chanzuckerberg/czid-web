import React from "react";
import DiscoveryView from "./DiscoveryView";
import { DISCOVERY_DOMAIN_LIBRARY } from "./discovery_api";

class LibraryView extends React.Component {
  render() {
    return <DiscoveryView domain={DISCOVERY_DOMAIN_LIBRARY} />;
  }
}

export default LibraryView;
