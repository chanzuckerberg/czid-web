import { isEmpty } from "lodash/fp";
import React, { useState } from "react";
import AnnouncementBanner from "~/components/common/AnnouncementBanner";
import ExternalLink from "~/components/ui/controls/ExternalLink";
import IconMobileNavClose from "~/components/ui/icons/IconMobileNavClose";
import { CZIDLogoReversed } from "~ui/icons";
import cs from "./LandingHeader.scss";

interface LandingHeaderProps {
  announcementBannerEnabled?: boolean;
  emergencyBannerMessage?: string;
  impactPage?: boolean;
}

export const LandingHeader = ({
  announcementBannerEnabled,
  emergencyBannerMessage,
  impactPage,
}: LandingHeaderProps) => {
  const [menuOpen, setMenuOpen] = useState(false);

  function toggleMobileNav() {
    setMenuOpen(!menuOpen);
  }

  return (
    <>
      {/* Announcement banners we only want to show on the landing page, not within the app */}

      <AnnouncementBanner
        id="emergency"
        visible={!isEmpty(emergencyBannerMessage)}
        message={emergencyBannerMessage}
      />

      <AnnouncementBanner
        id="czid-transfer"
        visible={announcementBannerEnabled}
        message={
          <>
            {
              " UCSF’S INSTITUTE FOR GLOBAL HEALTH SCIENCES WILL MANAGE CZ ID TOWARD THE END OF 2025. CLICK "
            }
            <ExternalLink
              className={cs.link}
              href="https://chanzuckerberg.zendesk.com/hc/en-us/articles/33940279703828-FAQs-CZ-ID-s-Transfer-to-the-University-of-California-San-Francisco"
            >
              HERE
            </ExternalLink>
            {" FOR MORE INFORMATION. "}
          </>
        }
      />

      <div className={cs.header} data-testid="home-top-nav-bar">
        <a aria-label="Go to the CZ ID homepage" href="/">
          <CZIDLogoReversed className={cs.headerLogo} />
        </a>
        <nav className={cs.nav} data-test-id="home-top-nav">
          <span className={cs.hideMobile}>
            <a
              className={`${cs.textLink} ${
                impactPage ? cs.textLinkActive : null
              }`}
              href="/impact"
              aria-label="View the CZ ID impact page"
              data-testid="home-top-nav-impact"
            >
              Case Studies
            </a>
            <a
              className={cs.textLink}
              href="http://help.czid.org"
              target="_blank"
              rel="noreferrer"
              aria-label="View the CZ ID help page (opens in new window)"
              data-testid="home-top-nav-resources"
            >
              Resources
            </a>
            <a
              className={cs.buttonLink}
              href="/auth0/login"
              data-testid="home-top-nav-login"
            >
              Sign in
            </a>
          </span>
          <div
            onClick={toggleMobileNav}
            onKeyDown={toggleMobileNav}
            className={cs.hamburgerIcon}
            data-testid="home-mobile-hamburger"
            role="button"
            tabIndex={0}
          >
            <div className={cs.bar1}></div>
            <div className={cs.bar2}></div>
            <div className={cs.bar3}></div>
          </div>
          <div
            className={cs.mobileNav}
            style={menuOpen ? { width: "100%" } : { width: "0" }}
          >
            <div className={cs.mobileNavCloseContainer}>
              <span
                className={cs.mobileNavClose}
                onClick={toggleMobileNav}
                onKeyDown={toggleMobileNav}
                data-testid="home-mobile-close-hamburger"
                role="button"
                tabIndex={0}
              >
                <IconMobileNavClose />
              </span>
            </div>
            <div className={cs.mobileNavLinkContainer}>
              <a
                className={cs.mobileNavLink}
                href="/impact"
                style={menuOpen ? { opacity: "1" } : { opacity: "0" }}
                target="_blank"
                rel="noreferrer"
                aria-label="View the CZ ID impact page (opens in new window)"
                data-testid="home-mobile-menu-impact"
              >
                Case Studies
              </a>
              <a
                className={cs.mobileNavLink}
                href="http://help.czid.org"
                style={menuOpen ? { opacity: "1" } : { opacity: "0" }}
                target="_blank"
                rel="noreferrer"
                aria-label="View the CZ ID help page (opens in new window)"
                data-testid="home-mobile-menu-resources"
              >
                Resources
              </a>
              <div
                className={cs.mobileNavSeparator}
                style={menuOpen ? { opacity: "1" } : { opacity: "0" }}
              ></div>
              <a
                className={cs.mobileNavLink}
                href="/auth0/login"
                style={menuOpen ? { opacity: "1" } : { opacity: "0" }}
                data-testid="home-mobile-menu-login"
              >
                Sign In
              </a>
            </div>
          </div>
        </nav>
      </div>
    </>
  );
};
