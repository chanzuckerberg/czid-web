import React from "react";
import PropTypes from "prop-types";
import cx from "classnames";

import { logAnalyticsEvent } from "~/api/analytics";
import Link from "~ui/controls/Link";
import NoResultsIcon from "~ui/icons/NoResultsIcon";

import cs from "./info_banner.scss";

const InfoBanner = ({
  className,
  contentClassName,
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

  return (
    <div className={cx(cs.container, className)}>
      <div className={cx(cs.content, contentClassName)}>
        {title && <div className={cx(cs.title, titleClassName)}>{title}</div>}
        {message && (
          <div className={cx(cs.message, messageClassName)}>{message}</div>
        )}
        {suggestion && <div className={cs.suggestion}>{suggestion}</div>}
        {link && (
          <Link className={cs.link} href={link.href}>
            {link.text}
            <i className={cx("fa fa-chevron-right", cs.rightArrow)} />
          </Link>
        )}
      </div>
      <div className={cx(cs.icon, iconClassName)}>{icon}</div>
    </div>
  );
};

InfoBanner.defaultProps = {
  // Defaults to the most commonly used banner settings
  icon: <NoResultsIcon className={cs.icon} />,
};

InfoBanner.propTypes = {
  className: PropTypes.string,
  contentClassName: PropTypes.string,
  icon: PropTypes.node,
  iconClassName: PropTypes.string,
  link: PropTypes.shape({
    text: PropTypes.string.isRequired,
    href: PropTypes.string.isRequired,
  }),
  message: PropTypes.node,
  messageClassName: PropTypes.string,
  suggestion: PropTypes.string,
  title: PropTypes.string,
  titleClassName: PropTypes.string,
  type: PropTypes.string,
};

export default InfoBanner;
