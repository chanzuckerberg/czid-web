import React from "react";
import PropTypes from "prop-types";
import cx from "classnames";

import { logAnalyticsEvent } from "~/api/analytics";
import Link from "~ui/controls/Link";
import NoResultsIcon from "~ui/icons/NoResultsIcon";

import cs from "./no_results_banner.scss";

const NoResultsBanner = ({
  className,
  icon,
  link,
  message,
  suggestion,
  title,
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
      <div className={cs.content}>
        {title && <div className={cs.title}>{title}</div>}
        {message && <div className={cs.message}>{message}</div>}
        {suggestion && <div className={cs.suggestion}>{suggestion}</div>}
        {link && (
          <Link className={cs.link} href={link.href}>
            {link.text}
            <i className={cx("fa fa-chevron-right", cs.rightArrow)} />
          </Link>
        )}
      </div>
      <div className={cs.icon}>{icon}</div>
    </div>
  );
};

NoResultsBanner.defaultProps = {
  // Defaults to the most commonly used banner settings
  icon: <NoResultsIcon className={cs.icon} />,
};

NoResultsBanner.propTypes = {
  className: PropTypes.string,
  icon: PropTypes.node,
  link: PropTypes.shape({
    text: PropTypes.string.isRequired,
    href: PropTypes.string.isRequired,
  }),
  message: PropTypes.string,
  suggestion: PropTypes.string,
  title: PropTypes.string,
  type: PropTypes.string,
};

export default NoResultsBanner;
