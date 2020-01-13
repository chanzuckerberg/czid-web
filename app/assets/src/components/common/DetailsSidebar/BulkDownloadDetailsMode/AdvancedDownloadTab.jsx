import React from "react";
import copy from "copy-to-clipboard";
import cx from "classnames";

import PropTypes from "~/components/utils/propTypes";
import CopyIcon from "~ui/icons/CopyIcon";
import BasicPopup from "~/components/BasicPopup";
import { withAnalytics } from "~/api/analytics";

import cs from "./bulk_download_details_mode.scss";

export default class AdvancedDownloadTab extends React.Component {
  state = {
    tooltip: "",
  };

  hasCLICommand = () => {
    const { bulkDownload } = this.props;
    return (
      bulkDownload.status === "success" &&
      bulkDownload.presigned_output_url !== null
    );
  };

  getCLICommand = () => {
    const { bulkDownload } = this.props;

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

    return `curl -L "${bulkDownload.presigned_output_url}" > "${
      bulkDownload.download_name
    }.tar.gz"\
        && mkdir -p "${bulkDownload.download_name}"\
        && tar -zvxf "${bulkDownload.download_name}.tar.gz" -C "${
      bulkDownload.download_name
    }"\
      `;
  };

  copyCommandToClipboard = () => {
    copy(this.getCLICommand());
    this.setState({
      tooltip: "Copied command to clipboard",
    });
  };

  resetTooltip = () => {
    this.setState({
      tooltip: "",
    });
  };

  render() {
    const { bulkDownload } = this.props;

    const handleCLICommandClick = this.hasCLICommand()
      ? withAnalytics(
          this.copyCommandToClipboard,
          "AdvancedDownloadTab_copy-cloud-command-link_clicked",
          {
            bulkDownloadId: bulkDownload.id,
            fileSize: bulkDownload.file_size,
          }
        )
      : null;

    const cloudCommandContainer = (
      <div
        className={cx(
          cs.cloudCommandContainer,
          this.hasCLICommand() && cs.enabled
        )}
        onClick={handleCLICommandClick}
        onMouseLeave={this.resetTooltip}
      >
        <div className={cs.command}>{this.getCLICommand()}</div>
        <CopyIcon className={cs.icon} />
      </div>
    );

    return (
      <div className={cs.advancedDownloadTab}>
        <div className={cs.header}>Download via command line:</div>
        <div className={cs.description}>
          Copy and paste the following command into your terminal to download
          and extract your files into a folder called{" "}
          {bulkDownload.download_name}:
        </div>
        {this.state.tooltip ? (
          <BasicPopup
            trigger={cloudCommandContainer}
            content={this.state.tooltip}
            inverted
            open
            position="top left"
          />
        ) : (
          cloudCommandContainer
        )}
      </div>
    );
  }
}

AdvancedDownloadTab.propTypes = {
  bulkDownload: PropTypes.BulkDownload,
};
