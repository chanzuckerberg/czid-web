import cx from "classnames";
import React from "react";

import { trackEvent } from "~/api/analytics";
import cs from "./link.scss";

interface LinkProps {
  // We use black styling for links on a colored background.
  coloredBackground?: boolean;
  children?: React.ReactNode;
  className?: string;
  external?: boolean;
  href?: string;
  // We intentionally don't have an onClick prop, because we don't want to encourage arbitrary onClick handlers,
  // since there is already an on-click behavior (following the link href). trackEvent is an exception.
  analyticsEventName?: string;
  analyticsEventData?: object;
  externalLink: boolean;
}

class Link extends React.Component<LinkProps> {
  onClick = () => {
    const {
      analyticsEventData,
      analyticsEventName,
      external,
      href,
    } = this.props;

    if (analyticsEventName) {
      trackEvent(analyticsEventName, analyticsEventData);
    } else {
      trackEvent("Link_generic_clicked", {
        external: external,
        href: href,
      });
    }
  };
  static defaultProps: LinkProps;

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
          className,
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

Link.defaultProps = {
  analyticsEventData: {},
  coloredBackground: false,
  externalLink: false,
};

export default Link;
