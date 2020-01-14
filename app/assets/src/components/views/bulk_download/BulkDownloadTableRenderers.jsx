import React from "react";

import DownloadIcon from "~ui/icons/DownloadIcon";
import StatusLabel from "~ui/labels/StatusLabel";
import LoadingBar from "~ui/controls/LoadingBar";

import cs from "./bulk_download_table_renderers.scss";

export default class BulkDownloadTableRenderers extends React.Component {
  static renderDownload = ({ rowData }, admin = false) => {
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
          <div className={cs.metadata}>
            <span className={cs.detailsLink} onClick={rowData.onStatusClick}>
              Details
            </span>
            {admin && (
              <React.Fragment>
                | <span className={cs.userName}>{rowData.user_name}</span>
              </React.Fragment>
            )}
          </div>
        </div>
      </div>
    );
  };

  static renderNumberOfSamples = ({ rowData }) => {
    return <div className={cs.samplesCell}>{rowData.num_samples}</div>;
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
          </div>
        </div>
      );
    }

    if (status === "error") {
      return (
        <div className={cs.statusCell}>
          <div className={cs.links}>
            <a className={cs.link} href="mailto:help@idseq.net">
              Contact us
            </a>
          </div>
        </div>
      );
    }

    return (
      <div className={cs.statusCell}>
        <LoadingBar percentage={progress} showHint tiny />
      </div>
    );
  };
}
