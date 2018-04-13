import React from 'react';

class ErrorBoundary extends React.Component {
  componentDidCatch(error, info) {
		console.log(error, info);
  }

  render() {
    return this.props.children;
  }
}
export default ErrorBoundary;
