import React from "react";
import PropTypes from "prop-types";
import cs from "./view_header.scss";

class RightControls extends React.Component {
  // Used for extracting this node in ViewHeader.
  static type = "ViewHeader.RightControls";

  render() {
    return <div className={cs.rightControls}>{this.props.children}</div>;
  }
}

RightControls.propTypes = {
  children: PropTypes.node
};

export default RightControls;
