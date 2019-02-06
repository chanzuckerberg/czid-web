import React from "react";
import PropTypes from "prop-types";
import DiscoveryView from "./DiscoveryView";

class LibraryView extends React.Component {
  render() {
    return <DiscoveryView onlyLibrary />;
  }
}

export default LibraryView;
