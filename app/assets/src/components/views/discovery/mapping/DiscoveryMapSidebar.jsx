import React from "react";
import cx from "classnames";

import PropTypes from "~/components/utils/propTypes";

export default class DiscoveryMapSidebar extends React.Component {
  render() {
    const { className } = this.props;

    return <div className={cx(className)} />;
  }
}

DiscoveryMapSidebar.propTypes = {
  className: PropTypes.string
};
