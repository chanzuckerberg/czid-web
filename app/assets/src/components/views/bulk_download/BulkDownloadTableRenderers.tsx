import { Icon } from "czifui";
import { find, get } from "lodash/fp";
import React from "react";
import { WORKFLOWS } from "~/components/utils/workflows";
import LoadingBar from "~ui/controls/LoadingBar";
import StatusLabel from "~ui/labels/StatusLabel";
import cs from "./bulk_download_table_renderers.scss";
import { BULK_DOWNLOAD_TYPES } from "./constants";

export default class BulkDownloadTableRenderers extends React.Component {
  static renderDownload = ({ rowData }, admin = false) => {
    if (!rowData) {
      return null;
    }

    return (
      <div className={cs.downloadCell}>
        <Icon
          className={cs.downloadIcon}
          sdsIcon="download"
          sdsSize="xl"
          sdsType="button"
        />
        <div className={cs.downloadRightPane}>
          <div className={cs.downloadNameContainer}>
            <div className={cs.downloadName} data-testid="download-name">
              {rowData.download_name}
            </div>
            <StatusLabel
              className={cs.downloadStatus}
              status={rowData.statusDisplay}
              type={rowData.statusType}
              tooltipText={rowData.tooltipText}
            />
          </div>
          <div className={cs.metadata}>
            <span
              className={cs.detailsLink}
              onClick={rowData.onStatusClick}
              data-testid={"download-details-link"}
            >
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

    let analysisTypeString = count === 1 ? "Sample" : "Samples";
    if (bulkDownloadType !== BULK_DOWNLOAD_TYPES.SAMPLE_METADATA) {
      const workflowLabelField = count === 1 ? "label" : "pluralizedLabel";
      const workflowObj = find(
        { value: get("analysis_type", rowData) },
        WORKFLOWS,
      );
      analysisTypeString = get(workflowLabelField, workflowObj);
    }

    return <div>{`${count} ${analysisTypeString}`}</div>;
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
            <a className={cs.link} href="mailto:help@czid.org">
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
