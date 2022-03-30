import PropTypes from "prop-types";
import React from "react";

import ExternalLink from "~ui/controls/ExternalLink";
import { CZIDLogoReversed } from "~ui/icons";
import TransparentButton from "../ui/controls/buttons/TransparentButton";

import cs from "./landing.scss";

const LandingHeader = ({ browserInfo }) => {
  const signInLink = () => {
    location.href = "/auth0/login";
  };
  return (
    <div className={cs.header}>
      <div className={cs.siteHeader}>
        <div className={cs.brandDetails}>
          <a href="/">
            <span className={cs.logoIcon}>
              <CZIDLogoReversed />
            </span>
          </a>
        </div>
        <div className={cs.fill} />
        <div className={cs.links}>
          <ExternalLink
            className={cs.headerLink}
            href="https://help.czid.org"
            analyticsEventName="Landing_help-center-link_clicked"
          >
            Help Center
          </ExternalLink>
          <ExternalLink
            className={cs.headerLink}
            href="https://www.czid.org/impact"
            analyticsEventName="Landing_video-tour-link_clicked"
          >
            Video Tour
          </ExternalLink>
          <ExternalLink
            className={cs.headerLink}
            // NOTE(2021-09-30): Alternatively there is https://boards.greenhouse.io/chanzuckerberginitiative/jobs/2931482 as of now.
            href="https://boards.greenhouse.io/chanzuckerberginitiative/jobs/3293983"
            analyticsEventName="Landing_hiring-link_clicked"
          >
            Hiring
          </ExternalLink>
          <ExternalLink
            className={cs.headerLink}
            href="https://github.com/chanzuckerberg/czid-workflows"
            analyticsEventName="Landing_github-link_clicked"
          >
            GitHub
          </ExternalLink>
        </div>
        {browserInfo.supported ? (
          <div className="sign-in">
            <TransparentButton
              text="Sign In"
              onClick={signInLink}
              disabled={!browserInfo.supported}
            />
          </div>
        ) : (
          <div className="alert-browser-support">
            {browserInfo.browser} is not currently supported. Please sign in
            from a different browser.
          </div>
        )}
      </div>
    </div>
  );
};

LandingHeader.propTypes = {
  browserInfo: PropTypes.object,
};

export default LandingHeader;
