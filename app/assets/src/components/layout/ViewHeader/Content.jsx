import React from "react";
import PropTypes from "prop-types";
import cs from "./view_header.scss";

class ViewHeaderContent extends React.Component {
  render() {
    return <div className={cs.content}>{this.props.children}</div>;
  }
}

ViewHeaderContent.propTypes = {
  children: PropTypes.node
};

ViewHeaderContent.CLASS_NAME = "ViewHeaderContent";

export default ViewHeaderContent;
