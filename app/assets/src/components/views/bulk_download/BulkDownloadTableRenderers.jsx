import React from "react";
import cx from "classnames";

import AlertIcon from "~ui/icons/AlertIcon";
import CircleCheckmarkIcon from "~ui/icons/CircleCheckmarkIcon";
import DownloadIcon from "~ui/icons/DownloadIcon";
import LoadingIcon from "~ui/icons/LoadingIcon";
import BasicPopup from "~/components/BasicPopup";
import LoadingBar from "~ui/controls/LoadingBar";

import cs from "./bulk_download_table_renderers.scss";

export default class BulkDownloadTableRenderers extends React.Component {
  static renderDownload = ({ rowData }) => {
    if (!rowData) {
      return null;
    }

    return (
      <div className={cs.downloadCell}>
        <DownloadIcon className={cs.downloadIcon} />
        <div className={cs.downloadRightPane}>
          <div className={cs.downloadName}>{rowData.download_name}</div>
          <div className={cs.sampleCount} onClick={rowData.onStatusClick}>
            {rowData.num_samples} Sample{rowData.num_samples === 1 ? "" : "s"}
          </div>
        </div>
      </div>
    );
  };

  static renderStatus = ({ rowData }) => {
    const { status, error_message, progress } = rowData;

    if (status === "success") {
      return (
        <div className={cs.statusCell}>
          <div className={cs.messageContainer}>
            <CircleCheckmarkIcon
              className={cx(cs.icon, error_message && cs.warning)}
            />
            <div className={cs.message}>Ready to download</div>
            {error_message && (
              <BasicPopup
                trigger={<div className={cs.warningTooltip}>1 warning</div>}
                content={error_message}
                position="top right"
              />
            )}
          </div>
          <div className={cs.links}>
            <div className={cs.link} onClick={rowData.onDownloadFileClick}>
              Download File
            </div>
            <div className={cs.separator}>|</div>
            <BasicPopup
              trigger={
                <div className={cs.link} onClick={rowData.onCopyUrlClick}>
                  Copy Url
                </div>
              }
              content="Copy a signed URL for your file which expires in 24 hours. For advanced users."
              position="top right"
            />
          </div>
        </div>
      );
    }

    if (status === "error") {
      return (
        <div className={cs.statusCell}>
          <div className={cs.messageContainer}>
            <AlertIcon className={cx(cs.icon, cs.error)} />
            <div className={cs.message}>Failed to generate download</div>
          </div>
          <div className={cs.links}>
            <a className={cs.link} href="mailto:help@idseq.net">
              Contact us for help
            </a>
          </div>
        </div>
      );
    }

    return (
      <div className={cs.statusCell}>
        <div className={cs.messageContainer}>
          <LoadingIcon className={cx(cs.icon, cs.loading)} />
          <div className={cs.message}>Generating your download files...</div>
        </div>
        <LoadingBar percentage={progress || 0} />
      </div>
    );
  };
}
