import { Icon } from "@czi-sds/components";
import cx from "classnames";
import copy from "copy-to-clipboard";
import moment from "moment";
import React, { useState } from "react";
import { withAnalytics } from "~/api/analytics";
import BasicPopup from "~/components/BasicPopup";
import { BulkDownloadDetails } from "~/interface/shared";
import cs from "./bulk_download_details_mode.scss";

interface AdvancedDownloadTabProps {
  bulkDownload: BulkDownloadDetails;
}

const AdvancedDownloadTab = ({ bulkDownload }: AdvancedDownloadTabProps) => {
  const [tooltip, setTooltip] = useState("");
  const hasCLICommand = () => {
    return (
      bulkDownload.status === "success" &&
      bulkDownload.presigned_output_url !== null
    );
  };

  const getCLICommand = () => {
    if (
      bulkDownload.status === "waiting" ||
      bulkDownload.status === "running"
    ) {
      return "Bulk download is not yet complete.";
    }

    if (bulkDownload.status === "error") {
      return "Bulk download failed. Please contact us for help.";
    }

    if (
      bulkDownload.status === "success" &&
      bulkDownload.presigned_output_url === null
    ) {
      return "Failed to generate command. Please contact us for help.";
    }

    const currentTimestamp = moment().format("MM-D-YYYY hh-mm-ssa");
    const bulkDownloadFileName = `${bulkDownload.download_name}-${currentTimestamp}`;

    if (bulkDownload.download_type === "biom_format") {
      return `curl -L "${bulkDownload.presigned_output_url}" > "${bulkDownloadFileName}.biom" `;
    }

    return `curl -L "${bulkDownload.presigned_output_url}" > "${bulkDownloadFileName}.tar.gz"\
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
        "AdvancedDownloadTab_copy-cloud-command-link_clicked",
        {
          bulkDownloadId: bulkDownload.id,
          fileSize: bulkDownload.file_size,
        },
      )
    : null;

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
      <div className={cs.command}>{getCLICommand()}</div>
      <Icon className={cs.icon} sdsIcon="copy" sdsSize="s" sdsType="static" />
    </div>
  );

  return (
    <div className={cs.advancedDownloadTab}>
      <div className={cs.header}>Download via command line:</div>
      <div className={cs.description}>
        Copy and paste the following command into your terminal to download and
        extract your files into a folder called {bulkDownload.download_name}:
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

export default AdvancedDownloadTab;
