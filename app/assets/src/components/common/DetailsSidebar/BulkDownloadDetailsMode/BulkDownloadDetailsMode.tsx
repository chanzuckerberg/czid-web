import React, { useContext, useEffect, useState } from "react";
import { getBulkDownload } from "~/api/bulk_downloads";
import { UserContext } from "~/components/common/UserContext";
import ExternalLink from "~/components/ui/controls/ExternalLink";
import Tabs from "~/components/ui/controls/Tabs";
import {
  BulkDownloadDetails,
  BulkDownloadStatusType,
  DownloadType,
} from "~/interface/shared";
import Notification from "~ui/notifications/Notification";
import cs from "./bulk_download_details_mode.scss";
import { AdvancedDownloadTab } from "./components/AdvancedDownloadTab";
import { DetailsTab } from "./components/DetailsTab";

type TabNames = "Details" | "Advanced Download";
const TABS: TabNames[] = ["Details", "Advanced Download"];

export interface BDDProps {
  bulkDownloadId?: number;
}

export const BulkDownloadDetailsMode = ({ bulkDownloadId }: BDDProps) => {
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
    if (!bulkDownloadId) {
      return;
    }
    fetchBulkDownload(bulkDownloadId);
  }, [bulkDownloadId]);

  const onTabChange = (tab: TabNames) => {
    setCurrentTab(tab);
  };

  const { download_name, error_message, execution_type, log_url, id, status } =
    bulkDownloadDetails ?? {};

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
      {status === BulkDownloadStatusType.ERROR && (
        <Notification
          type="error"
          displayStyle="flat"
          className={cs.notification}
        >
          There was an error generating your download files. Please contact us
          for help.
        </Notification>
      )}
      {status === BulkDownloadStatusType.SUCCESS && error_message && (
        <Notification
          type="warning"
          displayStyle="flat"
          className={cs.notification}
        >
          {error_message}
        </Notification>
      )}
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
