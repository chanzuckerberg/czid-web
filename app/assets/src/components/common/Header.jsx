import { forbidExtraProps } from "airbnb-prop-types";
import cx from "classnames";
import { isEmpty } from "lodash/fp";
import moment from "moment";
import PropTypes from "prop-types";
import React from "react";

import { logAnalyticsEvent, withAnalytics } from "~/api/analytics";
import AnnouncementBanner from "~/components/common/AnnouncementBanner";
import { UserContext } from "~/components/common/UserContext";
import ExternalLink from "~/components/ui/controls/ExternalLink";
import { showToast } from "~/components/utils/toast";
import {
  DISCOVERY_DOMAIN_MY_DATA,
  DISCOVERY_DOMAIN_ALL_DATA,
  DISCOVERY_DOMAIN_PUBLIC,
} from "~/components/views/discovery/discovery_api";
import ToastContainer from "~ui/containers/ToastContainer";
import BareDropdown from "~ui/controls/dropdowns/BareDropdown";
import { LogoReversed } from "~ui/icons";
import Notification from "~ui/notifications/Notification";
import { postToUrlWithCSRF } from "~utils/links";

import cs from "./header.scss";

// TODO(mark): Remove after this expires.
const PRIVACY_UPDATE_DATE = moment("2019-06-24", "YYYY-MM-DD");

const setPrivacyUpdateNotificationViewed = () => {
  localStorage.setItem("dismissedPrivacyUpdateNotification", "true");
};

const showPrivacyUpdateNotification = () => {
  const daysLeft = Math.ceil(
    moment.duration(PRIVACY_UPDATE_DATE.diff(moment())).asDays()
  );

  if (daysLeft > 0) {
    showToast(({ closeToast }) => (
      <Notification
        type="warning"
        onClose={() => {
          setPrivacyUpdateNotificationViewed();
          closeToast();
        }}
      >
        Our Terms of Use and Privacy Policy will be updating in {daysLeft}{" "}
        {daysLeft === 1 ? "day" : "days"}.{" "}
        <a
          href="/terms_changes"
          onClick={setPrivacyUpdateNotificationViewed}
          className={cs.notificationLink}
        >
          Read a summary of the changes here.
        </a>
      </Notification>
    ));
  }
};

class Header extends React.Component {
  componentDidMount() {
    const { userSignedIn } = this.props;
    if (userSignedIn) {
      this.displayPrivacyUpdateNotification();
    }
  }

  displayPrivacyUpdateNotification = () => {
    const dismissedPrivacyUpdateNotification = localStorage.getItem(
      "dismissedPrivacyUpdateNotification"
    );

    if (dismissedPrivacyUpdateNotification !== "true") {
      showPrivacyUpdateNotification();
    }
  };

  render() {
    const {
      adminUser,
      announcementBannerEnabled,
      emergencyBannerMessage,
      disableNavigation,
      showBlank,
      userSignedIn,
      ...userMenuProps
    } = this.props;

    const { allowedFeatures } = this.context || {};

    if (showBlank) {
      return (
        <div className={cs.header}>
          <div className={cs.logo}>
            <LogoReversed className={cs.icon} />
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
          // TODO: add rebrand announcement banner message
          message="Lorem ipsum"
          inverted={true}
        />
        <div className={cs.header}>
          <div className={cs.logo}>
            <a href="/">
              <LogoReversed className={cs.icon} />
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
                allowedFeatures={allowedFeatures}
                {...userMenuProps}
              />
            ) : (
              <TermsMenuDropDown />
            ))}
        </div>
        {
          // Initialize the toast container - can be done anywhere (has absolute positioning)
        }
        <ToastContainer />
        {userSignedIn && (
          <iframe
            className={cs.backgroundRefreshFrame}
            src="/auth0/background_refresh"
          />
        )}
      </div>
    );
  }
}

Header.propTypes = {
  adminUser: PropTypes.bool,
  announcementBannerEnabled: PropTypes.bool,
  emergencyBannerMessage: PropTypes.string,
  disableNavigation: PropTypes.bool,
  showBlank: PropTypes.bool,
  userSignedIn: PropTypes.bool,
};

Header.contextType = UserContext;

const TermsDropdownItem = (
  <BareDropdown.Item
    key="terms_of_service"
    text={
      <a
        className={cs.option}
        target="_blank"
        rel="noopener noreferrer"
        href="/terms"
        onClick={() =>
          logAnalyticsEvent("Header_dropdown-terms-option_clicked")
        }
      >
        Terms of Use
      </a>
    }
  />
);

const PrivacyDropdownItem = (
  <BareDropdown.Item
    key="privacy_policy"
    text={
      <a
        className={cs.option}
        target="_blank"
        rel="noopener noreferrer"
        href="/privacy"
        onClick={() =>
          logAnalyticsEvent("Header_dropdown-privacy-policy-option_clicked")
        }
      >
        Privacy Policy
      </a>
    }
  />
);

const TermsMenuDropDown = () => {
  return (
    <div>
      <BareDropdown
        trigger={<div className={cs.terms}>{"Terms"}</div>}
        className={cs.termsDropdown}
        items={[TermsDropdownItem, PrivacyDropdownItem]}
        direction="left"
      />
    </div>
  );
};

const UserMenuDropDown = ({
  adminUser,
  email,
  signInEndpoint,
  signOutEndpoint,
  userName,
  allowedFeatures,
}) => {
  const signOut = () => postToUrlWithCSRF(signOutEndpoint);

  const renderItems = adminUser => {
    let userDropdownItems = [];

    userDropdownItems.push(
      <BareDropdown.Item
        key="downloads"
        text={
          <a
            className={cs.option}
            href="/bulk_downloads"
            onClick={() =>
              logAnalyticsEvent("Header_dropdown-downloads-option_clicked")
            }
          >
            Downloads
          </a>
        }
      />
    );

    adminUser &&
      userDropdownItems.push(
        <BareDropdown.Item
          key="user_settings"
          text={
            <a
              className={cs.option}
              href="/user_settings"
              onClick={() =>
                logAnalyticsEvent(
                  "Header_dropdown-user-settings-option_clicked"
                )
              }
            >
              Settings
            </a>
          }
        />
      );

    userDropdownItems.push(
      <BareDropdown.Item
        key="help"
        text={
          <ExternalLink
            className={cs.option}
            href="https://help.idseq.net"
            analyticsEventName={"Header_dropdown-help-option_clicked"}
          >
            Help Center
          </ExternalLink>
        }
      />,
      <BareDropdown.Item
        key="feedback"
        text={
          <a
            className={cs.option}
            href={`mailto:${email}?Subject=Report%20Feedback`}
            onClick={() =>
              logAnalyticsEvent("Header_dropdown-feedback-option_clicked")
            }
          >
            Contact Us
          </a>
        }
      />
    );

    adminUser &&
      userDropdownItems.push(
        <BareDropdown.Item
          key="create_user"
          text={
            <a className={cs.option} href="/users/new">
              Create User
            </a>
          }
        />
      );

    userDropdownItems.push(
      <BareDropdown.Divider key="divider_one" />,
      TermsDropdownItem,
      PrivacyDropdownItem
    );

    userDropdownItems.push(
      <BareDropdown.Divider key="divider_two" />,
      <BareDropdown.Item
        key="logout"
        text="Logout"
        onClick={withAnalytics(
          signOut,
          "Header_dropdown-logout-option_clicked"
        )}
      />
    );
    return userDropdownItems;
  };

  return (
    <div>
      <BareDropdown
        trigger={<div className={cs.userName}>{userName}</div>}
        className={cs.userDropdown}
        items={renderItems(adminUser)}
        direction="left"
      />
    </div>
  );
};

UserMenuDropDown.propTypes = forbidExtraProps({
  adminUser: PropTypes.bool,
  email: PropTypes.string.isRequired,
  signInEndpoint: PropTypes.string.isRequired,
  signOutEndpoint: PropTypes.string.isRequired,
  userName: PropTypes.string.isRequired,
  allowedFeatures: PropTypes.arrayOf(PropTypes.string),
});

const MainMenu = ({ adminUser, userSignedIn }) => {
  const isSelected = tab => window.location.pathname.startsWith(`/${tab}`);

  if (!userSignedIn) {
    return (
      <div className={cs.loggedOutMainMenu}>
        {/* Keep referrer links */}
        <a
          className={cs.item}
          href="https://help.idseq.net"
          rel="noopener noreferrer"
          /* eslint-disable-next-line react/jsx-no-target-blank */
          target="_blank"
          onClick={() => logAnalyticsEvent("MainMenu_help_clicked")}
        >
          Help Center
        </a>
      </div>
    );
  }

  return (
    <div className={cs.mainMenu}>
      <a
        className={cx(
          cs.item,
          isSelected(DISCOVERY_DOMAIN_MY_DATA) && cs.selected
        )}
        href={`/${DISCOVERY_DOMAIN_MY_DATA}`}
      >
        My Data
      </a>
      <a
        className={cx(
          cs.item,
          isSelected(DISCOVERY_DOMAIN_PUBLIC) && cs.selected
        )}
        href={`/${DISCOVERY_DOMAIN_PUBLIC}`}
      >
        Public
      </a>
      {adminUser && (
        <a
          className={cx(
            cs.item,
            isSelected(DISCOVERY_DOMAIN_ALL_DATA) && cs.selected
          )}
          href={`/${DISCOVERY_DOMAIN_ALL_DATA}`}
        >
          All Data
        </a>
      )}
      <a
        className={cx(cs.item, isSelected("samples/upload") && cs.selected)}
        href={"/samples/upload"}
        onClick={() => logAnalyticsEvent("Header_upload-link_clicked")}
      >
        Upload
      </a>
    </div>
  );
};

MainMenu.propTypes = {
  adminUser: PropTypes.bool,
  userSignedIn: PropTypes.bool,
};

export default Header;
