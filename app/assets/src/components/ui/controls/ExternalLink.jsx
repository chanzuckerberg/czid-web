import React from "react";
import PropTypes from "prop-types";

import { logAnalyticsEvent } from "~/api/analytics";

class ExternalLink extends React.Component {
  onClick = () => {
    const { analyticsEventName, analyticsEventData } = this.props;

    if (analyticsEventName) {
      logAnalyticsEvent(analyticsEventName, analyticsEventData);
    }
  };

  render() {
    const { href, className, children } = this.props;
    return (
      <a
        href={href}
        className={className}
        target="_blank"
        rel="noopener noreferrer"
        onClick={this.onClick}
      >
        {children}
      </a>
    );
  }
}

ExternalLink.propTypes = {
  className: PropTypes.string,
  href: PropTypes.string,
  children: PropTypes.node,
  // We intentionally don't have an onClick prop, because we don't want to encourage arbitrary onClick handlers,
  // since there is already an on-click behavior (following the link href). logAnalyticsEvent is an exception.
  analyticsEventName: PropTypes.string,
  analyticsEventData: PropTypes.object,
};

ExternalLink.defaultProps = {
  analyticsEventData: {},
};

export default ExternalLink;
