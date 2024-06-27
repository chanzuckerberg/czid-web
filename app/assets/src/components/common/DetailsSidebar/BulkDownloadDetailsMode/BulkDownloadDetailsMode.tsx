import React, { useContext, useEffect, useState } from "react";
import { useFragment } from "react-relay";
import { graphql } from "relay-runtime";
import { UserContext } from "~/components/common/UserContext";
import ExternalLink from "~/components/ui/controls/ExternalLink";
import Tabs from "~/components/ui/controls/Tabs";
import { BulkDownloadListQuery$data } from "~/components/views/BulkDownloadListView/BulkDownloadList/__generated__/BulkDownloadListQuery.graphql";
import { getDownloadDisplayName } from "~/components/views/BulkDownloadListView/constants";
import { BulkDownloadStatus } from "~/interface/shared";
import Notification from "~ui/notifications/Notification";
import cs from "./bulk_download_details_mode.scss";
import { AdvancedDownloadTab } from "./components/AdvancedDownloadTab";
import { AdvancedDownloadTabFragment$key } from "./components/AdvancedDownloadTab/__generated__/AdvancedDownloadTabFragment.graphql";
import { DetailsTab } from "./components/DetailsTab";
import { DetailsTabFragment$key } from "./components/DetailsTab/__generated__/DetailsTabFragment.graphql";
import {
  BulkDownloadDetailsModeFragment$data,
  BulkDownloadDetailsModeFragment$key,
} from "./__generated__/BulkDownloadDetailsModeFragment.graphql";

type TabNames = "Details" | "Advanced Download";
const TABS: TabNames[] = ["Details", "Advanced Download"];

export interface BulkDownloadDetailsProps {
  bulkDownloadId?: string;
  bulkDownloadData: BulkDownloadListQuery$data["fedBulkDownloads"];
}

export const BulkDownloadDetailsModeFragment = graphql`
  fragment BulkDownloadDetailsModeFragment on query_fedBulkDownloads_items
  @relay(plural: true) {
    id
    url
    logUrl
    status
    fileSize
    downloadType
    errorMessage
    params {
      paramType
      value
      displayName
    }
  }
`;

export const BulkDownloadDetailsMode = ({
  bulkDownloadData,
  bulkDownloadId,
}: BulkDownloadDetailsProps) => {
  const { admin } = useContext(UserContext) ?? {};

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [currentTab, setCurrentTab] = useState<TabNames>(TABS[0]);
  const [bulkDownloadDetails, setBulkDownloadDetails] =
    useState<BulkDownloadDetailsModeFragment$data[0]>();

  const data = useFragment<BulkDownloadDetailsModeFragment$key>(
    BulkDownloadDetailsModeFragment,
    bulkDownloadData as BulkDownloadDetailsModeFragment$key,
  );

  useEffect(() => {
    if (!bulkDownloadId) {
      return;
    }
    setIsLoading(true);

    const newBulkDownloadDetails = data.find(
      item => item.id === bulkDownloadId,
    );
    setBulkDownloadDetails(newBulkDownloadDetails);
    setIsLoading(false);
  }, [data, bulkDownloadId]);

  const onTabChange = (tab: TabNames) => {
    setCurrentTab(tab);
  };

  const { downloadType, errorMessage, logUrl, id, status } =
    bulkDownloadDetails ?? {};

  if (!downloadType) {
    return null;
  }

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
        {getDownloadDisplayName(downloadType)}
      </div>
      {admin && (
        <div className={cs.adminDetails}>
          ID: {id}
          {logUrl && (
            <span>
              ,{" "}
              <ExternalLink className={cs.logUrl} href={logUrl}>
                log url
              </ExternalLink>
            </span>
          )}
        </div>
      )}
      {status === BulkDownloadStatus.FAILED && (
        <Notification
          type="error"
          displayStyle="flat"
          className={cs.notification}
        >
          There was an error generating your download files. Please contact us
          for help.
        </Notification>
      )}
      {status === BulkDownloadStatus.SUCCEEDED && errorMessage && (
        <Notification
          type="warning"
          displayStyle="flat"
          className={cs.notification}
        >
          {errorMessage}
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
          bulkDownloadData={bulkDownloadData as DetailsTabFragment$key}
          bulkDownloadId={bulkDownloadId}
        />
      )}
      {currentTab === "Advanced Download" && (
        <AdvancedDownloadTab
          bulkDownloadData={bulkDownloadData as AdvancedDownloadTabFragment$key}
          bulkDownloadId={bulkDownloadId}
        />
      )}
    </div>
  );
};
