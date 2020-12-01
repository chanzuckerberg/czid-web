import React from "react";
import PropTypes from "prop-types";
import cx from "classnames";

import { logAnalyticsEvent } from "~/api/analytics";
import Link from "~ui/controls/Link";
import ExternalLink from "~ui/controls/ExternalLink";
import ImgSearchSecondary from "~ui/illustrations/ImgSearchSecondary";
import { IconArrowRight } from "~ui/icons";
import cs from "./info_banner.scss";

const InfoBanner = ({
  className,
  contentClassName,
  listenerLink,
  icon,
  iconClassName,
  link,
  message,
  messageClassName,
  suggestion,
  title,
  titleClassName,
  type,
}) => {
  // This is a hack to associate the event with the parent component, DiscoveryView
  logAnalyticsEvent("DiscoveryView_no-results-banner_displayed", {
    message,
    title,
    type,
  });

  const renderListenerLink = () => {
    // listenerLink will look like a link but instead of having an href, it has an onClick
    return (
      <span className={cs.link} onClick={listenerLink.onClick}>
        {listenerLink.text} <IconArrowRight />
      </span>
    );
  };

  const renderLink = () => {
    if (link.external) {
      return (
        <ExternalLink className={cs.link} href={link.href}>
          {link.text}
          <IconArrowRight />
        </ExternalLink>
      );
    } else {
      return (
        <Link className={cs.link} href={link.href}>
          {link.text}
          <IconArrowRight />
        </Link>
      );
    }
  };

  return (
    <div className={cx(cs.container, className)}>
      <div className={cx(cs.content, contentClassName)}>
        {title && <div className={cx(cs.title, titleClassName)}>{title}</div>}
        {message && (
          <div className={cx(cs.message, messageClassName)}>{message}</div>
        )}
        {suggestion && <div className={cs.suggestion}>{suggestion}</div>}
        {listenerLink ? renderListenerLink() : link && renderLink()}
      </div>
      <div className={cx(cs.icon, iconClassName)}>{icon}</div>
    </div>
  );
};

InfoBanner.defaultProps = {
  // Defaults to the most commonly used banner settings
  icon: <ImgSearchSecondary className={cs.icon} />,
};

InfoBanner.propTypes = {
  className: PropTypes.string,
  contentClassName: PropTypes.string,
  listenerLink: PropTypes.shape({
    text: PropTypes.string.isRequired,
    onClick: PropTypes.func.isRequired,
  }),
  icon: PropTypes.node,
  iconClassName: PropTypes.string,
  link: PropTypes.shape({
    text: PropTypes.string.isRequired,
    href: PropTypes.string.isRequired,
    external: PropTypes.bool,
  }),
  message: PropTypes.node,
  messageClassName: PropTypes.string,
  suggestion: PropTypes.string,
  title: PropTypes.string,
  titleClassName: PropTypes.string,
  type: PropTypes.string,
};

export default InfoBanner;
