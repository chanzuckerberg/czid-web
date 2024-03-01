import { Icon } from "@czi-sds/components";
import cx from "classnames";
import copy from "copy-to-clipboard";
import moment from "moment";
import React, { useState } from "react";
import { ANALYTICS_EVENT_NAMES, useWithAnalytics } from "~/api/analytics";
import BasicPopup from "~/components/BasicPopup";
import cs from "~/components/common/DetailsSidebar/BulkDownloadDetailsMode/bulk_download_details_mode.scss";
import { BulkDownloadDetails } from "~/interface/shared";

interface AdvancedDownloadTabProps {
  bulkDownload?: BulkDownloadDetails;
}

export const AdvancedDownloadTab = ({
  bulkDownload,
}: AdvancedDownloadTabProps) => {
  const withAnalytics = useWithAnalytics();
  const [tooltip, setTooltip] = useState("");
  const hasCLICommand = () => {
    return (
      bulkDownload?.status === "success" &&
      bulkDownload?.presigned_output_url !== null
    );
  };

  const getCLICommand = () => {
    if (
      bulkDownload?.status === "waiting" ||
      bulkDownload?.status === "running"
    ) {
      return "Bulk download is not yet complete.";
    }

    if (bulkDownload?.status === "error") {
      return "Bulk download failed. Please contact us for help.";
    }

    if (
      bulkDownload?.status === "success" &&
      bulkDownload.presigned_output_url === null
    ) {
      return "Failed to generate command. Please contact us for help.";
    }

    const currentTimestamp = moment().format("MM-D-YYYY hh-mm-ssa");
    const bulkDownloadFileName = `${bulkDownload?.download_name}-${currentTimestamp}`;

    if (bulkDownload?.download_type === "biom_format") {
      return `curl -L "${bulkDownload.presigned_output_url}" > "${bulkDownloadFileName}.biom" `;
    }

    return `curl -L "${bulkDownload?.presigned_output_url}" > "${bulkDownloadFileName}.tar.gz"\
        && mkdir "${bulkDownloadFileName}"\
        && tar -zvxf "${bulkDownloadFileName}.tar.gz" -C "${bulkDownloadFileName}"\
      `;
  };

  const copyCommandToClipboard = () => {
    copy(getCLICommand());
    setTooltip("Copied command to clipboard");
  };

  const resetTooltip = () => setTooltip("");

  const handleCLICommandClick = hasCLICommand()
    ? withAnalytics(
        copyCommandToClipboard,
        ANALYTICS_EVENT_NAMES.ADVANCED_DOWNLOAD_TAB_COPY_CLOUD_COMMAND_LINK_CLICKED,
        {
          bulkDownloadId: bulkDownload?.id,
          fileSize: bulkDownload?.file_size,
        },
      )
    : null;

  const cloudCommandContainer = (
    <div
      className={cx(cs.cloudCommandContainer, hasCLICommand() && cs.enabled)}
      // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2322
      onClick={handleCLICommandClick}
      // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2322
      onKeyDown={handleCLICommandClick}
      onMouseLeave={resetTooltip}
      role="button"
      tabIndex={0}
      data-testid="cloud-command-container"
    >
      <div className={cs.command}>{getCLICommand()}</div>
      <Icon className={cs.icon} sdsIcon="copy" sdsSize="s" sdsType="static" />
    </div>
  );

  return (
    <div className={cs.advancedDownloadTab}>
      <div className={cs.header}>Download via command line:</div>
      <div className={cs.description}>
        Copy and paste the following command into your terminal to download and
        extract your files into a folder called {bulkDownload?.download_name}:
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
