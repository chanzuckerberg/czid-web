import React from "react";

import DownloadIcon from "~ui/icons/DownloadIcon";
import StatusLabel from "~ui/labels/StatusLabel";
import BasicPopup from "~/components/BasicPopup";
import LoadingBar from "~ui/controls/LoadingBar";

import cs from "./bulk_download_table_renderers.scss";

const PROGRESS_BAR_MINIMUM = 0.04;

export default class BulkDownloadTableRenderers extends React.Component {
  static renderDownload = ({ rowData }) => {
    if (!rowData) {
      return null;
    }

    return (
      <div className={cs.downloadCell}>
        <DownloadIcon className={cs.downloadIcon} />
        <div className={cs.downloadRightPane}>
          <div className={cs.downloadNameContainer}>
            <div className={cs.downloadName}>{rowData.download_name}</div>
            <StatusLabel
              className={cs.downloadStatus}
              status={rowData.statusDisplay}
              type={rowData.statusType}
              tooltipText={rowData.tooltipText}
            />
          </div>
          <div className={cs.sampleCount} onClick={rowData.onStatusClick}>
            {rowData.num_samples} Sample{rowData.num_samples === 1 ? "" : "s"}
          </div>
        </div>
      </div>
    );
  };

  static renderStatus = ({ rowData }) => {
    const { status, progress } = rowData;

    if (status === "success") {
      return (
        <div className={cs.statusCell}>
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
        <LoadingBar percentage={Math.max(progress, PROGRESS_BAR_MINIMUM)} />
      </div>
    );
  };
}
