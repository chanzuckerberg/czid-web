import React from "react";
import PropTypes from "prop-types";
import cs from "./view_header.scss";

class Content extends React.Component {
  // Used for extracting this node in ViewHeader.
  static type = "ViewHeader.Content";

  render() {
    return <div className={cs.content}>{this.props.children}</div>;
  }
}

Content.propTypes = {
  children: PropTypes.node
};

export default Content;
