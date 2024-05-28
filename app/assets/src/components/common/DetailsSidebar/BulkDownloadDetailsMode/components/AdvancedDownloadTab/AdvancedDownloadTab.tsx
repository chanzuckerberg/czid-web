import { Icon } from "@czi-sds/components";
import cx from "classnames";
import copy from "copy-to-clipboard";
import moment from "moment";
import React, { useState } from "react";
import { useFragment } from "react-relay";
import { graphql } from "relay-runtime";
import { ANALYTICS_EVENT_NAMES, useWithAnalytics } from "~/api/analytics";
import BasicPopup from "~/components/common/BasicPopup";
import cs from "~/components/common/DetailsSidebar/BulkDownloadDetailsMode/bulk_download_details_mode.scss";
import {
  FailedStatus,
  getDownloadDisplayName,
  InProgressStatus,
} from "~/components/views/BulkDownloadListView/constants";
import { BulkDownloadStatus } from "~/interface/shared";
import { AdvancedDownloadTabFragment$key } from "./__generated__/AdvancedDownloadTabFragment.graphql";

interface AdvancedDownloadTabProps {
  bulkDownloadId?: string;
  bulkDownloadData: AdvancedDownloadTabFragment$key;
}

export const AdvancedDownloadTabFragment = graphql`
  fragment AdvancedDownloadTabFragment on query_fedBulkDownloads_items
  @relay(plural: true) {
    id
    url
    status
    fileSize
    downloadType
    params {
      paramType
      value
      displayName
    }
  }
`;

export const AdvancedDownloadTab = ({
  bulkDownloadData,
  bulkDownloadId,
}: AdvancedDownloadTabProps) => {
  const withAnalytics = useWithAnalytics();
  const [tooltip, setTooltip] = useState("");

  const data = useFragment(AdvancedDownloadTabFragment, bulkDownloadData);
  const bulkDownloadDetails = data.find(item => item.id === bulkDownloadId);
  const { downloadType, status, url, id, fileSize, params } =
    bulkDownloadDetails ?? {};
  if (!downloadType) {
    return null;
  }
  const hasCLICommand = () => {
    return status === BulkDownloadStatus.SUCCEEDED && url !== null;
  };

  const getCLICommand = (status, downloadType) => {
    if (InProgressStatus.includes(status)) {
      return "Bulk download is not yet complete.";
    }

    if (FailedStatus.includes(status)) {
      return "Bulk download failed. Please contact us for help.";
    }

    if (status === BulkDownloadStatus.SUCCEEDED && url === null) {
      return "Failed to generate command. Please contact us for help.";
    }

    const currentTimestamp = moment().format("MM-D-YYYY hh-mm-ssa");
    const bulkDownloadFileName = `${getDownloadDisplayName(
      downloadType,
    )}-${currentTimestamp}`;

    if (downloadType === "biom_format") {
      return `curl -L "${url}" > "${bulkDownloadFileName}.biom" `;
    }

    if (downloadType === "consensus_genome") {
      const downloadFormat = params?.find(
        param => param?.paramType === "downloadFormat",
      );
      if (
        downloadFormat &&
        downloadFormat.value &&
        ["Single File (Concatenated)", "concatenate"].includes(
          downloadFormat.value,
        )
      ) {
        return `curl -L "${url}" > "${bulkDownloadFileName}.fa" `;
      }
    }

    return `curl -L "${url}" > "${bulkDownloadFileName}.tar.gz"\
        && mkdir "${bulkDownloadFileName}"\
        && tar -zvxf "${bulkDownloadFileName}.tar.gz" -C "${bulkDownloadFileName}"\
      `;
  };

  const copyCommandToClipboard = (status, downloadType) => {
    copy(getCLICommand(status, downloadType));
    setTooltip("Copied command to clipboard");
  };

  const resetTooltip = () => setTooltip("");

  const handleCLICommandClick = hasCLICommand()
    ? withAnalytics(
        () => copyCommandToClipboard(status, downloadType),
        ANALYTICS_EVENT_NAMES.ADVANCED_DOWNLOAD_TAB_COPY_CLOUD_COMMAND_LINK_CLICKED,
        {
          bulkDownloadId: id,
          fileSize: fileSize,
        },
      )
    : // eslint-disable-next-line @typescript-eslint/no-empty-function
      () => {};

  const cloudCommandContainer = (
    <div
      className={cx(cs.cloudCommandContainer, hasCLICommand() && cs.enabled)}
      onClick={handleCLICommandClick}
      onKeyDown={handleCLICommandClick}
      onMouseLeave={resetTooltip}
      role="button"
      tabIndex={0}
      data-testid="cloud-command-container"
    >
      <div className={cs.command}>{getCLICommand(status, downloadType)}</div>
      <Icon className={cs.icon} sdsIcon="copy" sdsSize="s" sdsType="static" />
    </div>
  );

  return (
    <div className={cs.advancedDownloadTab}>
      <div className={cs.header}>Download via command line:</div>
      <div className={cs.description}>
        Copy and paste the following command into your terminal to download and
        extract your files into a folder called{" "}
        {getDownloadDisplayName(downloadType)}:
      </div>
      {tooltip ? (
        <BasicPopup
          trigger={cloudCommandContainer}
          content={tooltip}
          inverted
          open
          position="top left"
        />
      ) : (
        cloudCommandContainer
      )}
    </div>
  );
};
