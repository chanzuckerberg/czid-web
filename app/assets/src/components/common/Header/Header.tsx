import { isEmpty } from "lodash/fp";
import React from "react";
import AnnouncementBanner from "~/components/common/AnnouncementBanner";
import ExternalLink from "~/components/ui/controls/ExternalLink";
import ToastContainer from "~ui/containers/ToastContainer";
import { CZIDLogoReversed } from "~ui/icons";
import { postToUrlWithCSRF } from "~utils/links";
import cs from "./header.scss";
import MainMenu from "./MainMenu";
import UserMenuDropDown, { TermsMenuDropDown } from "./UserMenuDropDown";

interface HeaderProps {
  adminUser: boolean;
  announcementBannerEnabled: boolean;
  emergencyBannerMessage: string;
  disableNavigation: boolean;
  showBlank: boolean;
  showLogOut: boolean;
  userSignedIn: boolean;
  email: string;
  signOutEndpoint: string;
  userName: string;
}

const Header = ({
  adminUser,
  disableNavigation,
  showBlank,
  showLogOut,
  userSignedIn,
  emergencyBannerMessage,
  announcementBannerEnabled,
  signOutEndpoint,
  userName,
}: HeaderProps) => {
  if (showBlank) {
    return (
      <div className={cs.header}>
        <div className={cs.logo}>
          <CZIDLogoReversed className={cs.icon} />
        </div>
      </div>
    );
  }
  if (showLogOut) {
    return (
      <div className={cs.header}>
        <div className={cs.logo}>
          <CZIDLogoReversed className={cs.icon} />
        </div>
        <div className={cs.fill} />
        <div className={cs.logout}>
          <span
            onClick={() => {
              sessionStorage.clear();
              postToUrlWithCSRF(signOutEndpoint);
            }}
            onKeyDown={() => {
              sessionStorage.clear();
              postToUrlWithCSRF(signOutEndpoint);
            }}
            role="button"
            tabIndex={0}
          >
            Log Out
          </span>
        </div>
      </div>
    );
  }
  return (
    <div>
      {/* Announcement banners we only want to show within the app, not the landing page */}

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

      <div className={cs.header}>
        <div className={cs.logo}>
          <a href="/">
            <CZIDLogoReversed className={cs.icon} />
          </a>
        </div>
        <div className={cs.fill} />
        {!disableNavigation && (
          <MainMenu adminUser={adminUser} userSignedIn={userSignedIn} />
        )}
        {!disableNavigation &&
          (userSignedIn ? (
            <UserMenuDropDown
              adminUser={adminUser}
              signOutEndpoint={signOutEndpoint}
              userName={userName}
            />
          ) : (
            <TermsMenuDropDown />
          ))}
      </div>
      {/* Initialize the toast container - can be done anywhere (has absolute positioning) */}
      <ToastContainer />
      {userSignedIn && (
        <iframe
          title="background_refresh"
          className={cs.backgroundRefreshFrame}
          src="/auth0/background_refresh"
        />
      )}
    </div>
  );
};

export default Header;
