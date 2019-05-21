import React from "react";
import PropTypes from "prop-types";
import moment from "moment";
import { forbidExtraProps } from "airbnb-prop-types";
import cx from "classnames";

import { showToast } from "~/components/utils/toast";
import Notification from "~ui/notifications/Notification";
import { RequestContext } from "~/components/common/RequestContext";
import ToastContainer from "~ui/containers/ToastContainer";
import BareDropdown from "~ui/controls/dropdowns/BareDropdown";
import LogoIcon from "~ui/icons/LogoIcon";
import {
  DISCOVERY_DOMAIN_MY_DATA,
  DISCOVERY_DOMAIN_ALL_DATA,
  DISCOVERY_DOMAIN_PUBLIC
} from "~/components/views/discovery/discovery_api";
import { openUrl } from "~utils/links";
import { deleteAsync } from "~/api/core";
import { logAnalyticsEvent, withAnalytics } from "~/api/analytics";

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
        type="warn"
        onClose={() => {
          setPrivacyUpdateNotificationViewed();
          closeToast();
        }}
      >
        Our Terms of Use and Privacy Privacy will be updating in {daysLeft}{" "}
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
    const { adminUser, userSignedIn, ...userMenuProps } = this.props;

    return (
      userSignedIn && (
        <div>
          <div className={cs.header}>
            <div className={cs.logo}>
              <a href="/">
                <LogoIcon className={cs.icon} />
              </a>
            </div>
            <div className={cs.fill} />
            <RequestContext.Consumer>
              {({ enabledFeatures }) => {
                if (enabledFeatures.includes("data_discovery")) {
                  return (
                    <MainMenu
                      adminUser={adminUser}
                      newSampleUpload={enabledFeatures.includes(
                        "new_sample_upload"
                      )}
                    />
                  );
                }
              }}
            </RequestContext.Consumer>
            <UserMenuDropDown adminUser={adminUser} {...userMenuProps} />
          </div>
          {
            // Initialize the toast container - can be done anywhere (has absolute positioning)
          }
          <ToastContainer />
        </div>
      )
    );
  }
}

Header.propTypes = {
  adminUser: PropTypes.bool,
  userSignedIn: PropTypes.bool
};

const UserMenuDropDown = ({
  adminUser,
  demoUser,
  email,
  signInEndpoint,
  signOutEndpoint,
  userName
}) => {
  const signOut = () => {
    deleteAsync(`${signOutEndpoint}.json`, {
      withCredentials: true
    }).then(_ => {
      openUrl(signInEndpoint);
    });
  };

  const renderItems = (adminUser, demoUser, dataDiscovery, newSampleUpload) => {
    let userDropdownItems = [];
    if (!demoUser) {
      if (!dataDiscovery) {
        userDropdownItems.push(
          <BareDropdown.Item
            key="1"
            text={
              <a
                className={cs.option}
                href={newSampleUpload ? "/samples/upload" : "/samples/new"}
              >
                New Sample
              </a>
            }
          />
        );
        userDropdownItems.push(
          <BareDropdown.Item
            key="2"
            text={
              <a className={cs.option} href="/cli_user_instructions">
                New Sample (Command Line)
              </a>
            }
          />
        );
      }
    }

    adminUser &&
      userDropdownItems.push(
        <BareDropdown.Item
          key="3"
          text={
            <a className={cs.option} href="/users/new">
              Create User
            </a>
          }
        />
      );

    userDropdownItems.push(
      <BareDropdown.Item
        key="4"
        text={
          <a
            className={cs.option}
            href={`mailto:${email}?Subject=Report%20Feedback`}
            onClick={() =>
              logAnalyticsEvent("Header_dropdown-feedback-option_clicked")
            }
          >
            Report Feedback
          </a>
        }
      />,
      <BareDropdown.Item
        key="5"
        text={
          <a
            className={cs.option}
            target="_blank"
            rel="noopener noreferrer"
            href="https://assets.idseq.net/Terms.pdf"
            onClick={() =>
              logAnalyticsEvent("Header_dropdown-terms-option_clicked")
            }
          >
            Terms of Use
          </a>
        }
      />,
      <BareDropdown.Item
        key="6"
        text={
          <a
            className={cs.option}
            target="_blank"
            rel="noopener noreferrer"
            href="https://assets.idseq.net/Privacy.pdf"
            onClick={() =>
              logAnalyticsEvent("Header_dropdown-privacy-policy-option_clicked")
            }
          >
            Privacy Policy
          </a>
        }
      />,
      <BareDropdown.Item
        key="7"
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
      <RequestContext.Consumer>
        {({ enabledFeatures }) => (
          <BareDropdown
            trigger={<div className={cs.userName}>{userName}</div>}
            className={cs.userDropdown}
            items={renderItems(
              adminUser,
              demoUser,
              enabledFeatures.includes("data_discovery"),
              enabledFeatures.includes("new_sample_upload")
            )}
            direction="left"
          />
        )}
      </RequestContext.Consumer>
    </div>
  );
};

UserMenuDropDown.propTypes = forbidExtraProps({
  demoUser: PropTypes.bool,
  adminUser: PropTypes.bool,
  email: PropTypes.string.isRequired,
  signInEndpoint: PropTypes.string.isRequired,
  signOutEndpoint: PropTypes.string.isRequired,
  userName: PropTypes.string.isRequired
});

const MainMenu = ({ adminUser, newSampleUpload }) => {
  const isSelected = tab => window.location.pathname.startsWith(`/${tab}`);

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
        className={cx(
          cs.item,
          isSelected(newSampleUpload ? "samples/upload" : "samples/new") &&
            cs.selected
        )}
        href={newSampleUpload ? "/samples/upload" : "/samples/new"}
      >
        Upload
      </a>
    </div>
  );
};

MainMenu.propTypes = {
  adminUser: PropTypes.bool,
  newSampleUpload: PropTypes.bool
};

export default Header;
