import React from "react";
import { CONTACT_US_LINK } from "~/components/utils/documentationLinks";
import BareDropdown from "~ui/controls/dropdowns/BareDropdown";
import { postToUrlWithCSRF } from "~utils/links";
import ExternalLink from "../../ui/controls/ExternalLink";
import cs from "./header.scss";

interface UserMenuDropDownProps {
  adminUser?: boolean;
  signOutEndpoint: string;
  userName: string;
}

const UserMenuDropDown = ({
  adminUser,
  signOutEndpoint,
  userName,
}: UserMenuDropDownProps) => {
  const signOut = () => {
    sessionStorage.clear();
    postToUrlWithCSRF(signOutEndpoint);
  };

  const renderItems = (adminUser: boolean) => {
    const userDropdownItems: React.ReactNode[] = [];

    userDropdownItems.push(
      <BareDropdown.Item
        key="downloads"
        text={
          <a className={cs.option} href="/bulk_downloads">
            Downloads
          </a>
        }
      />,
    );

    if (adminUser) {
      userDropdownItems.push(
        <BareDropdown.Item
          key="admin_settings"
          text={
            <a className={cs.option} href="admin/admin_settings">
              Admin Settings
            </a>
          }
        />,
        <BareDropdown.Item
          key="list_users"
          text={
            <a
              className={cs.option}
              href={`/users?search_by=${userName}`}
              data-testid="list-users"
            >
              List Users
            </a>
          }
        />,
      );
    }

    userDropdownItems.push(
      <BareDropdown.Item
        key="help"
        text={
          <ExternalLink className={cs.option} href="https://help.czid.org">
            Help Center
          </ExternalLink>
        }
      />,
      <BareDropdown.Item
        key="feedback"
        text={
          <a
            className={cs.option}
            href={CONTACT_US_LINK}
            target="_blank"
            rel="noreferrer"
          >
            Contact Us
          </a>
        }
      />,
    );

    userDropdownItems.push(
      <BareDropdown.Divider key="divider_one" />,
      TermsDropdownItem,
      PrivacyDropdownItem,
    );

    userDropdownItems.push(
      <BareDropdown.Divider key="divider_two" />,
      <BareDropdown.Item key="logout" text="Logout" onClick={signOut} />,
    );
    return userDropdownItems;
  };

  return (
    <div>
      <BareDropdown
        trigger={<div className={cs.userName}>{userName}</div>}
        className={cs.userDropdown}
        // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2345
        items={renderItems(adminUser)}
        direction="left"
      />
    </div>
  );
};

export const TermsDropdownItem = (
  <BareDropdown.Item
    key="terms_of_service"
    text={
      <a
        className={cs.option}
        target="_blank"
        rel="noopener noreferrer"
        href="/terms"
      >
        Terms of Use
      </a>
    }
  />
);

export const PrivacyDropdownItem = (
  <BareDropdown.Item
    key="privacy_notice"
    text={
      <a
        className={cs.option}
        target="_blank"
        rel="noopener noreferrer"
        href="/privacy"
      >
        Privacy Policy
      </a>
    }
  />
);

export const TermsMenuDropDown = () => {
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

export default UserMenuDropDown;
