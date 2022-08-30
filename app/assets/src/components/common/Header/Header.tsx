import { isEmpty } from "lodash/fp";
import React from "react";

import AnnouncementBanner from "~/components/common/AnnouncementBanner";
import ExternalLink from "~/components/ui/controls/ExternalLink";
import ToastContainer from "~ui/containers/ToastContainer";
import { CZIDLogoReversed } from "~ui/icons";
import MainMenu from "./MainMenu";
import UserMenuDropDown, { TermsMenuDropDown } from "./UserMenuDropDown";
import cs from "./header.scss";

interface HeaderProps {
  adminUser: boolean;
  announcementBannerEnabled: boolean;
  emergencyBannerMessage: string;
  disableNavigation: boolean;
  showBlank: boolean;
  userSignedIn: boolean;
  email: string;
  signOutEndpoint: string;
  userName: string;
}

const Header = ({
  adminUser,
  announcementBannerEnabled,
  emergencyBannerMessage,
  disableNavigation,
  showBlank,
  userSignedIn,
  email,
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
  return (
    <div>
      <AnnouncementBanner
        id="emergency"
        visible={!isEmpty(emergencyBannerMessage)}
        message={emergencyBannerMessage}
      />
      <AnnouncementBanner
        id="rebrand"
        visible={announcementBannerEnabled}
        message="Looking for IDseq? You're in the right spot. As of December, our new name is Chan Zuckerberg ID."
        inverted={true}
      />
      <AnnouncementBanner
        id="alignment-scalability"
        visible={announcementBannerEnabled}
        message={
          <>
            {" "}
            We&#x27;re upgrading our pipeline to v7.0 on March 10. Learn more
            <ExternalLink href="https://info.chanzuckerberg.com/cz-id-pipeline-update-making-our-pipeline-more-scalable">
              {" "}
              here{" "}
            </ExternalLink>{" "}
          </>
        }
        inverted={false}
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
              email={email}
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
