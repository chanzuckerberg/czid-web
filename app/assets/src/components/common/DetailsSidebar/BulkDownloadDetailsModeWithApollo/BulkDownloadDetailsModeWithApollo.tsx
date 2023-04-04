import React, { useContext, useState } from "react";

import { trackEvent } from "~/api/analytics";
import { selectedBulkDownloadVar } from "~/cache/initialCache";
import { UserContext } from "~/components/common/UserContext";
import ExternalLink from "~/components/ui/controls/ExternalLink";
import Tabs from "~/components/ui/controls/Tabs";
import Notification from "~ui/notifications/Notification";

import { AdvancedDownloadTabWithApollo } from "./AdvancedDownloadTabWithApollo";
import cs from "./bulk_download_details_mode_with_apollo.scss";
import { DetailsTabWithApollo } from "./DetailsTabWithApollo";

type TabNames = "Details" | "Advanced Download";
const TABS: TabNames[] = ["Details", "Advanced Download"];

export const BulkDownloadDetailsModeWithApollo = () => {
  const { admin } = useContext(UserContext) ?? {};

  const [currentTab, setCurrentTab] = useState<TabNames>(TABS[0]);

  const { bulkDownload } = selectedBulkDownloadVar();

  const onTabChange = (tab: TabNames) => {
    setCurrentTab(tab);

    trackEvent("bulkDownloadDetailsMode_tab_changed", {
      bulkDownloadId: bulkDownload.id,
      tab,
    });
  };

  const { download_name, error_message, execution_type, log_url, id, status } =
    bulkDownload ?? {};

  const renderNotifications = () => {
    if (status === "error") {
      return (
        <Notification
          type="error"
          displayStyle="flat"
          className={cs.notification}
        >
          There was an error generating your download files. Please contact us
          for help.
        </Notification>
      );
    }

    if (status === "success" && error_message) {
      return (
        <Notification
          type="warning"
          displayStyle="flat"
          className={cs.notification}
        >
          {error_message}
        </Notification>
      );
    }

    return null;
  };

  return (
    <div className={cs.content}>
      <div className={cs.title}>{download_name}</div>
      {admin && (
        <div className={cs.adminDetails}>
          ID: {id}, run in: {execution_type}
          {log_url && (
            <span>
              ,{" "}
              <ExternalLink className={cs.logUrl} href={log_url}>
                log url
              </ExternalLink>
            </span>
          )}
        </div>
      )}
      {renderNotifications()}
      <Tabs
        className={cs.tabs}
        tabs={TABS}
        value={currentTab}
        onChange={onTabChange}
      />
      {currentTab === "Details" && <DetailsTabWithApollo />}
      {currentTab === "Advanced Download" && <AdvancedDownloadTabWithApollo />}
    </div>
  );
};
