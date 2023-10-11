import { isEmpty } from "lodash/fp";
import React from "react";
import AnnouncementBanner from "~/components/common/AnnouncementBanner";
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
      <AnnouncementBanner
        id="emergency"
        visible={!isEmpty(emergencyBannerMessage)}
        message={emergencyBannerMessage}
      />
      {/* ONT AnnouncementBanner should only be displayed on the landing page */}
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
