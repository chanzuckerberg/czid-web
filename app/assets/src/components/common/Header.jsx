import React from "react";
import PropTypes from "prop-types";
import moment from "moment";
import { forbidExtraProps } from "airbnb-prop-types";
import cx from "classnames";

import BasicPopup from "~/components/BasicPopup";
import { UserContext } from "~/components/common/UserContext";
import { showToast } from "~/components/utils/toast";
import Notification from "~ui/notifications/Notification";
import ToastContainer from "~ui/containers/ToastContainer";
import BareDropdown from "~ui/controls/dropdowns/BareDropdown";
import AlertIcon from "~ui/icons/AlertIcon";
import LogoIcon from "~ui/icons/LogoIcon";
import RemoveIcon from "~ui/icons/RemoveIcon";
import {
  DISCOVERY_DOMAIN_MY_DATA,
  DISCOVERY_DOMAIN_ALL_DATA,
  DISCOVERY_DOMAIN_PUBLIC,
} from "~/components/views/discovery/discovery_api";
import { postToUrlWithCSRF } from "~utils/links";
import { logAnalyticsEvent, withAnalytics } from "~/api/analytics";
import ExternalLink from "~/components/ui/controls/ExternalLink";

import cs from "./header.scss";

// TODO(mark): Remove after this expires.
const PRIVACY_UPDATE_DATE = moment("2019-06-24", "YYYY-MM-DD");

const NCOV_PUBLIC_SITE = true;

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
        type="warn"
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
  constructor(props) {
    super(props);
    this.state = {
      showAnnouncementBanner: false,
    };
  }

  componentDidMount() {
    const { userSignedIn, announcementBannerEnabled } = this.props;
    if (userSignedIn) {
      this.displayPrivacyUpdateNotification();
    }
    if (announcementBannerEnabled) {
      const dismissedAnnouncementBanner = localStorage.getItem(
        "dismissedAnnouncementBanner"
      );
      if (dismissedAnnouncementBanner !== "true") {
        this.setState({ showAnnouncementBanner: true });
      }
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

  handleAnnouncementBannerClose = () => {
    this.setState({ showAnnouncementBanner: false });
    localStorage.setItem("dismissedAnnouncementBanner", "true");
  };

  render() {
    const {
      adminUser,
      announcementBannerEnabled,
      disableNavigation,
      showBlank,
      userSignedIn,
      ...userMenuProps
    } = this.props;
    const { showAnnouncementBanner } = this.state;

    const { allowedFeatures } = this.context || {};

    if (showBlank) {
      return (
        <div className={cs.header}>
          <div className={cs.logo}>
            <LogoIcon className={cs.icon} />
          </div>
        </div>
      );
    }

    return (
      userSignedIn && (
        <div>
          {showAnnouncementBanner && (
            <AnnouncementBanner
              onClose={withAnalytics(
                this.handleAnnouncementBannerClose,
                "AnnouncementBanner_close_clicked"
              )}
            />
          )}
          <div className={cs.header}>
            <div className={cs.logo}>
              <a href="/">
                <LogoIcon className={cs.icon} />
              </a>
            </div>
            {NCOV_PUBLIC_SITE && (
              <a href="/">
                <div className={cs.publicNcovHomeLink}>
                  Coronavirus Public Data
                </div>
              </a>
            )}
            <div className={cs.fill} />
            {!disableNavigation && <MainMenu adminUser={adminUser} />}
            {!disableNavigation && (
              <UserMenuDropDown
                adminUser={adminUser}
                allowedFeatures={allowedFeatures}
                {...userMenuProps}
              />
            )}
          </div>
          {
            // Initialize the toast container - can be done anywhere (has absolute positioning)
          }
          <ToastContainer />
          <iframe
            className={cs.backgroundRefreshFrame}
            src="/auth0/background_refresh"
          />
        </div>
      )
    );
  }
}

Header.propTypes = {
  adminUser: PropTypes.bool,
  announcementBannerEnabled: PropTypes.bool,
  disableNavigation: PropTypes.bool,
  showBlank: PropTypes.bool,
  userSignedIn: PropTypes.bool,
};

Header.contextType = UserContext;

const AnnouncementBanner = ({ onClose }) => {
  return (
    <div className={cs.announcementBanner}>
      <BasicPopup
        content={
          "Low-Support Mode: We will only be responding to highly urgent issues from 12/21–12/29. For now, check out our Help Center. Happy Holidays!"
        }
        position="bottom center"
        wide="very"
        trigger={
          <span className={cs.content}>
            <AlertIcon className={cs.icon} />
            <span className={cs.title}>Low-Support Mode:</span>
            We will only be responding to highly urgent issues from 12/21–12/29.
            For now, check out our
            <ExternalLink
              className={cs.link}
              href="https://help.idseq.net"
              onClick={() =>
                logAnalyticsEvent("AnnouncementBanner_link_clicked")
              }
            >
              Help Center
            </ExternalLink>. Happy Holidays!
          </span>
        }
      />
      <RemoveIcon className={cs.close} onClick={() => onClose && onClose()} />
    </div>
  );
};

AnnouncementBanner.propTypes = {
  onClose: PropTypes.func,
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

    allowedFeatures.includes("bulk_downloads") &&
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

    !NCOV_PUBLIC_SITE &&
      userDropdownItems.push(
        <BareDropdown.Item
          key="help"
          text={
            <ExternalLink
              className={cs.option}
              href="https://help.idseq.net"
              onClick={() =>
                logAnalyticsEvent("Header_dropdown-help-option_clicked")
              }
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

    !NCOV_PUBLIC_SITE &&
      userDropdownItems.push(<BareDropdown.Divider key="divider_one" />);

    userDropdownItems.push(
      <BareDropdown.Item
        key="terms_of_service"
        text={
          <a
            className={cs.option}
            target="_blank"
            rel="noopener noreferrer"
            href="https://idseq.net/terms"
            onClick={() =>
              logAnalyticsEvent("Header_dropdown-terms-option_clicked")
            }
          >
            Terms of Use
          </a>
        }
      />,
      <BareDropdown.Item
        key="privacy_policy"
        text={
          <a
            className={cs.option}
            target="_blank"
            rel="noopener noreferrer"
            href="https://idseq.net/privacy"
            onClick={() =>
              logAnalyticsEvent("Header_dropdown-privacy-policy-option_clicked")
            }
          >
            Privacy Policy
          </a>
        }
      />
    );
    !NCOV_PUBLIC_SITE &&
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
        trigger={
          <div className={cs.userName}>
            {!NCOV_PUBLIC_SITE ? userName : "Menu"}
          </div>
        }
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

const MainMenu = ({ adminUser }) => {
  const isSelected = tab => window.location.pathname.startsWith(`/${tab}`);

  if (NCOV_PUBLIC_SITE) {
    return (
      <div className={cs.mainMenu}>
        <a
          className={cs.item}
          href="https://idseq.net"
          onClick={() => logAnalyticsEvent("MainMenu_request-access_clicked")}
        >
          Request Full Access
        </a>
        <a
          className={cs.item}
          href="https://help.idseq.net"
          onClick={() => logAnalyticsEvent("MainMenu_help_clicked")}
        >
          Help
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
};

export default Header;
