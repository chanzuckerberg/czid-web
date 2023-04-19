import React, { useContext, useEffect, useState } from "react";
import { trackEvent } from "~/api/analytics";
import { getBulkDownload } from "~/api/bulk_downloads";
import { UserContext } from "~/components/common/UserContext";
import ExternalLink from "~/components/ui/controls/ExternalLink";
import Tabs from "~/components/ui/controls/Tabs";
import {
  BulkDownloadDetails,
  DownloadType,
  NumberId,
} from "~/interface/shared";
import Notification from "~ui/notifications/Notification";
import AdvancedDownloadTab from "./AdvancedDownloadTab";
import cs from "./bulk_download_details_mode.scss";
import DetailsTab from "./DetailsTab";

type TabNames = "Details" | "Advanced Download";
const TABS: TabNames[] = ["Details", "Advanced Download"];

export interface BDDProps {
  bulkDownload: NumberId;
}

const BulkDownloadDetailsMode = ({ bulkDownload }: BDDProps) => {
  const { admin } = useContext(UserContext) ?? {};

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [currentTab, setCurrentTab] = useState<TabNames>(TABS[0]);
  const [bulkDownloadDetails, setBulkDownloadDetails] =
    useState<BulkDownloadDetails>();
  const [downloadType, setDownloadType] = useState<DownloadType>();

  const fetchBulkDownload = async (bulkDownloadId: number) => {
    const {
      bulk_download: newBulkDownloadDetails,
      download_type: newDownloadType,
    } = await getBulkDownload(bulkDownloadId);

    // Guard against possible race conditions.
    if (newBulkDownloadDetails.id === bulkDownloadId) {
      setBulkDownloadDetails(newBulkDownloadDetails);
      setDownloadType(newDownloadType);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    setIsLoading(true);
    fetchBulkDownload(bulkDownload.id);
  }, [bulkDownload]);

  const onTabChange = (tab: TabNames) => {
    setCurrentTab(tab);

    trackEvent("bulkDownloadDetailsMode_tab_changed", {
      bulkDownloadId: bulkDownload.id,
      tab,
    });
  };

  const { download_name, error_message, execution_type, log_url, id, status } =
    bulkDownloadDetails ?? {};

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

  if (isLoading) {
    return (
      <div className={cs.content}>
        <div className={cs.loadingMsg}>Loading...</div>
      </div>
    );
  }

  return (
    <div className={cs.content}>
      <div className={cs.title} data-testid={"sidebar-download-name"}>
        {download_name}
      </div>
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
      {currentTab === "Details" && (
        <DetailsTab
          bulkDownload={bulkDownloadDetails}
          downloadType={downloadType}
        />
      )}
      {currentTab === "Advanced Download" && (
        <AdvancedDownloadTab bulkDownload={bulkDownloadDetails} />
      )}
    </div>
  );
};

export default BulkDownloadDetailsMode;
