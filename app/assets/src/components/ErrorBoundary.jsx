import PropTypes from "prop-types";
import React from "react";

class ErrorBoundary extends React.Component {
  componentDidCatch(error, info) {
    // TODO: do proper error processing
    // eslint-disable-next-line no-console
    console.error("ErrorBoundary", error, info);
  }

  render() {
    return this.props.children;
  }
}

ErrorBoundary.propTypes = {
  children: PropTypes.node,
};

export default ErrorBoundary;
