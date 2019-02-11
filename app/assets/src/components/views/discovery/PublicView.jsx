import React from "react";
import DiscoveryView from "./DiscoveryView";

class PublicView extends React.Component {
  render() {
    return <DiscoveryView excludeLibrary />;
  }
}

export default PublicView;
