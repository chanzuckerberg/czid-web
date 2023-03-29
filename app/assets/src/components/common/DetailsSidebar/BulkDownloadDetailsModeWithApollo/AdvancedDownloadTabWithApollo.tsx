import cx from "classnames";
import copy from "copy-to-clipboard";
import { Icon } from "czifui";
import moment from "moment";
import React, { useState } from "react";

import { withAnalytics } from "~/api/analytics";
import { selectedBulkDownloadVar } from "~/cache/initialCache";
import BasicPopup from "~/components/BasicPopup";

import cs from "./bulk_download_details_mode_with_apollo.scss";

export const AdvancedDownloadTabWithApollo = () => {
  const [tooltip, setTooltip] = useState("");
  const { bulkDownload } = selectedBulkDownloadVar();
  const {
    status,
    presigned_output_url,
    download_name,
    download_type,
    id,
    file_size,
  } = bulkDownload;

  const hasCLICommand = () => {
    return status === "success" && presigned_output_url !== null;
  };

  const getCLICommand = () => {
    if (status === "waiting" || status === "running") {
      return "Bulk download is not yet complete.";
    }

    if (status === "error") {
      return "Bulk download failed. Please contact us for help.";
    }

    if (status === "success" && presigned_output_url === null) {
      return "Failed to generate command. Please contact us for help.";
    }

    const currentTimestamp = moment().format("MM-D-YYYY hh-mm-ssa");
    const bulkDownloadFileName = `${download_name}-${currentTimestamp}`;

    if (download_type === "biom_format") {
      return `curl -L "${presigned_output_url}" > "${bulkDownloadFileName}.biom" `;
    }

    return `curl -L "${presigned_output_url}" > "${bulkDownloadFileName}.tar.gz"\
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
          bulkDownloadId: id,
          fileSize: file_size,
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
        extract your files into a folder called {download_name}:
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
