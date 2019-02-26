import React from "React";
import PropTypes from "prop-types";
import cx from "classnames";

import cs from "./discovery_sidebar.scss";

export default class DiscoverySidebar extends React.Component {
  constructor(props) {
    super(props);

    // this.state = {

    // };
  }

  render() {
    return <div className={cx(this.props.className)}>hell ooooo</div>;
  }
}

DiscoverySidebar.propTypes = {
  className: PropTypes.string
};
