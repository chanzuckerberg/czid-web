import React from "react";
import PropTypes from "prop-types";
import { RequestContext } from "~/components/common/RequestContext";
import ToastContainer from "~ui/containers/ToastContainer";
import BareDropdown from "~ui/controls/dropdowns/BareDropdown";
import LogoIcon from "~ui/icons/LogoIcon";
import { openUrl } from "~utils/links";
import { deleteAsync } from "~/api/core";
import { forbidExtraProps } from "airbnb-prop-types";
import cs from "./header.scss";
import cx from "classnames";

class Header extends React.Component {
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
      }
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
          >
            Privacy Policy
          </a>
        }
      />,
      <BareDropdown.Item key="7" text="Logout" onClick={signOut} />
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

const MainMenu = ({ newSampleUpload }) => {
  const isSelected = tab => window.location.pathname.startsWith(`/${tab}`);

  return (
    <div className={cs.mainMenu}>
      <a
        className={cx(cs.item, isSelected("library") && cs.selected)}
        href="/library"
      >
        My Data
      </a>
      <a
        className={cx(cs.item, isSelected("public") && cs.selected)}
        href="/public"
      >
        Public
      </a>
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
  newSampleUpload: PropTypes.bool
};

export default Header;
