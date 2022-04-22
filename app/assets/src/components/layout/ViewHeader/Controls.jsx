import cx from "classnames";
import PropTypes from "prop-types";
import React from "react";
import cs from "./view_header.scss";

class ViewHeaderControls extends React.Component {
  render() {
    return (
      <div className={cx(cs.controls, this.props.className)}>
        {this.props.children}
      </div>
    );
  }
}

ViewHeaderControls.propTypes = {
  children: PropTypes.node,
  className: PropTypes.string,
};

ViewHeaderControls.CLASS_NAME = "ViewHeaderControls";

export default ViewHeaderControls;
