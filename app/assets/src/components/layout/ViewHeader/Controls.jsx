import React from "react";
import PropTypes from "prop-types";
import cs from "./view_header.scss";

class ViewHeaderControls extends React.Component {
  render() {
    return <div className={cs.controls}>{this.props.children}</div>;
  }
}

ViewHeaderControls.propTypes = {
  children: PropTypes.node
};

ViewHeaderControls.CLASS_NAME = "ViewHeaderControls";

export default ViewHeaderControls;
