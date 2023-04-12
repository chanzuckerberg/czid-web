import cx from "classnames";
import React from "react";
import { trackEvent } from "~/api/analytics";
import {
  DISCOVERY_DOMAIN_ALL_DATA,
  DISCOVERY_DOMAIN_MY_DATA,
  DISCOVERY_DOMAIN_PUBLIC,
} from "~/components/views/discovery/discovery_api";
import cs from "./header.scss";

interface MainMenuProps {
  adminUser: boolean;
  userSignedIn: boolean;
}

const MainMenu = ({ adminUser, userSignedIn }: MainMenuProps) => {
  const isSelected = (tab: string) =>
    window.location.pathname.startsWith(`/${tab}`);

  if (!userSignedIn) {
    return (
      <div className={cs.loggedOutMainMenu}>
        {/* Keep referrer links */}
        <a
          className={cs.item}
          href="https://help.czid.org"
          rel="noopener noreferrer"
          /* eslint-disable-next-line react/jsx-no-target-blank */
          target="_blank"
          onClick={() => trackEvent("MainMenu_help_clicked")}
          data-testid="menu-item-help-center"
        >
          Help Center
        </a>
      </div>
    );
  }

  return (
    <div className={cs.mainMenu} data-testid="top-menu">
      <a
        className={cx(
          cs.item,
          isSelected(DISCOVERY_DOMAIN_MY_DATA) && cs.selected,
        )}
        href={`/${DISCOVERY_DOMAIN_MY_DATA}`}
        data-testid="menu-item-mydata"
      >
        My Data
      </a>
      <a
        className={cx(
          cs.item,
          isSelected(DISCOVERY_DOMAIN_PUBLIC) && cs.selected,
        )}
        href={`/${DISCOVERY_DOMAIN_PUBLIC}`}
        data-testid="menu-item-public"
      >
        Public
      </a>
      {adminUser && (
        <a
          className={cx(
            cs.item,
            isSelected(DISCOVERY_DOMAIN_ALL_DATA) && cs.selected,
          )}
          href={`/${DISCOVERY_DOMAIN_ALL_DATA}`}
          data-testid="menu-item-all-data"
        >
          All Data
        </a>
      )}
      <a
        className={cx(cs.item, isSelected("samples/upload") && cs.selected)}
        href={"/samples/upload"}
        onClick={() => trackEvent("Header_upload-link_clicked")}
        data-testid="menu-item-upload"
      >
        Upload
      </a>
    </div>
  );
};

export default MainMenu;
