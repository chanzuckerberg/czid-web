import React from "react";

import DownloadIcon from "~ui/icons/DownloadIcon";
import LoadingIcon from "~ui/icons/LoadingIcon";

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

  static renderStatus = () => {
    // TODO(mark): Render differently depending on the status.
    // This is just the waiting status
    return (
      <div className={cs.statusCell}>
        <LoadingIcon className={cs.loadingIcon} />
        <div className={cs.message}>Generating your download files</div>
      </div>
    );
  };
}
