import React from "react";

class ErrorBoundary extends React.Component {
  componentDidCatch(error, info) {
    // TODO: do proper error processing
    // eslint-disable-next-line no-console
    console.log("ErrorBoundary", error, info);
  }

  render() {
    return this.props.children;
  }
}
export default ErrorBoundary;
