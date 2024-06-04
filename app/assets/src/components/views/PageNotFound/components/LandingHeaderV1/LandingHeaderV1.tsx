import React from "react";
import { TransparentButton } from "~ui/controls/buttons";
import ExternalLink from "~ui/controls/ExternalLink";
import { CZIDLogoReversed } from "~ui/icons";
import cs from "./landing.scss";

interface LandingHeaderV1Props {
  browserInfo?: {
    supported: boolean;
    browser: string;
  };
}

export const LandingHeaderV1 = ({ browserInfo }: LandingHeaderV1Props) => {
  const signInLink = () => {
    location.href = "/auth0/login";
  };
  return (
    <div className={cs.header}>
      <div className={cs.siteHeader}>
        <div className={cs.brandDetails}>
          <a href="/" data-testid="logo">
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
            data-testid="help-center"
          >
            Help Center
          </ExternalLink>
          <ExternalLink
            className={cs.headerLink}
            href="https://www.czid.org/impact"
            analyticsEventName="Landing_video-tour-link_clicked"
            data-testid="video-tour"
          >
            Video Tour
          </ExternalLink>
          <ExternalLink
            className={cs.headerLink}
            // NOTE(2021-09-30): Alternatively there is https://boards.greenhouse.io/chanzuckerberginitiative/jobs/2931482 as of now.
            href="https://boards.greenhouse.io/chanzuckerberginitiative/jobs/3293983"
            analyticsEventName="Landing_hiring-link_clicked"
            data-testid="hiring"
          >
            Hiring
          </ExternalLink>
          <ExternalLink
            className={cs.headerLink}
            href="https://github.com/chanzuckerberg/czid-workflows"
            analyticsEventName="Landing_github-link_clicked"
            data-testid="github"
          >
            GitHub
          </ExternalLink>
        </div>
        {/* @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2532 */}
        {browserInfo.supported ? (
          <div className="sign-in" data-testid="home-top-nav-login">
            <TransparentButton
              text="Sign In"
              onClick={signInLink}
              // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2532
              disabled={!browserInfo.supported}
            />
          </div>
        ) : (
          <div className="alert-browser-support">
            {/* @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2532 */}
            {browserInfo.browser} is not currently supported. Please sign in
            from a different browser.
          </div>
        )}
      </div>
    </div>
  );
};
