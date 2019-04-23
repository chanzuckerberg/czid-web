import React from "react";
import PropTypes from "prop-types";
import cx from "classnames";

import { logAnalyticsEvent } from "~/api/analytics";

import cs from "./no_results_banner.scss";
import NoResultsIcon from "../../ui/icons/NoResultsIcon";

const NoResultsBanner = ({ className, message, suggestion, type }) => {
  // This is a hack to associate the event with the parent component, DiscoveryView
  logAnalyticsEvent("DiscoveryView_no-results-banner_displayed", {
    type,
    message
  });
  return (
    <div className={cx(cs.container, className)}>
      <div className={cs.text}>
        <div className={cs.message}>{message}</div>
        <div className={cs.suggestion}>{suggestion}</div>
      </div>
      <div className={cs.icon}>
        <NoResultsIcon className={cs.icon} />
      </div>
    </div>
  );
};

NoResultsBanner.defaultProps = {
  message: "Sorry, no results match your search.",
  suggestion: "Try another search"
};

NoResultsBanner.propTypes = {
  className: PropTypes.string,
  message: PropTypes.string,
  suggestion: PropTypes.string,
  type: PropTypes.string
};

export default NoResultsBanner;
