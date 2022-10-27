import React from "react";

interface ErrorBoundaryProps {
  children?: React.ReactNode;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps> {
  componentDidCatch(error: $TSFixMe, info: $TSFixMe) {
    // TODO: do proper error processing
    // eslint-disable-next-line no-console
    console.error("ErrorBoundary", error, info);
  }

  render() {
    return this.props.children;
  }
}

export default ErrorBoundary;
