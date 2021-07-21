import cx from "classnames";
import PropTypes from "prop-types";
import React from "react";

import { logAnalyticsEvent } from "~/api/analytics";
import cs from "./link.scss";

class Link extends React.Component {
  onClick = () => {
    const {
      analyticsEventData,
      analyticsEventName,
      external,
      href,
    } = this.props;

    if (analyticsEventName) {
      logAnalyticsEvent(analyticsEventName, analyticsEventData);
    } else {
      logAnalyticsEvent("Link_generic_clicked", {
        external: external,
        href: href,
      });
    }
  };

  render() {
    const {
      href,
      coloredBackground,
      className,
      children,
      external,
    } = this.props;
    return (
      <a
        href={href}
        className={cx(
          coloredBackground ? cs.linkBlack : cs.linkDefault,
          className
        )}
        target={external ? "_blank" : null}
        rel="noopener noreferrer"
        onClick={this.onClick}
      >
        {children}
      </a>
    );
  }
}

Link.propTypes = {
  // We use black styling for links on a colored background.
  coloredBackground: PropTypes.bool,
  children: PropTypes.node,
  className: PropTypes.string,
  external: PropTypes.bool,
  href: PropTypes.string,

  // We intentionally don't have an onClick prop, because we don't want to encourage arbitrary onClick handlers,
  // since there is already an on-click behavior (following the link href). logAnalyticsEvent is an exception.
  analyticsEventName: PropTypes.string,
  analyticsEventData: PropTypes.object,
};

Link.defaultProps = {
  analyticsEventData: {},
  coloredBackground: false,
  externalLink: false,
};

export default Link;
