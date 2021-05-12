import React from "react";
import { find, get } from "lodash/fp";

import { WORKFLOWS } from "~/components/utils/workflows";
import { IconDownload } from "~ui/icons";
import StatusLabel from "~ui/labels/StatusLabel";
import LoadingBar from "~ui/controls/LoadingBar";
import { BULK_DOWNLOAD_TYPES } from "./constants";

import cs from "./bulk_download_table_renderers.scss";

export default class BulkDownloadTableRenderers extends React.Component {
  static renderDownload = ({ rowData }, admin = false) => {
    if (!rowData) {
      return null;
    }

    return (
      <div className={cs.downloadCell}>
        <IconDownload className={cs.downloadIcon} />
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
                |<span className={cs.userName}>{rowData.user_name}</span>
              </React.Fragment>
            )}
          </div>
        </div>
      </div>
    );
  };

  static renderCount = ({ rowData }) => {
    const bulkDownloadType = get("download_type", rowData);

    const count =
      bulkDownloadType === BULK_DOWNLOAD_TYPES.SAMPLE_METADATA
        ? get("num_samples", rowData)
        : get("analysis_count", rowData);

    const analysisType =
      bulkDownloadType === BULK_DOWNLOAD_TYPES.SAMPLE_METADATA
        ? `Sample`
        : get(
            "label",
            find({ value: get("analysis_type", rowData) }, WORKFLOWS)
          );

    return <div>{`${count} ${analysisType}${count > 1 ? "s" : ""}`}</div>;
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
