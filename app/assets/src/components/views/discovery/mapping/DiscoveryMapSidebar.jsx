import React from "react";
import cx from "classnames";

import PropTypes from "~/components/utils/propTypes";

import cs from "./discovery_map_sidebar.scss";

export default class DiscoveryMapSidebar extends React.Component {
  render() {
    const { className } = this.props;

    return <div className={cx(className, cs.sidebar)} />;
  }
}

DiscoveryMapSidebar.propTypes = {
  className: PropTypes.string
};
