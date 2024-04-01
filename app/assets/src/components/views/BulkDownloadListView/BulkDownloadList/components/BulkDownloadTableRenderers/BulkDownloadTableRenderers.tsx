import { Icon } from "@czi-sds/components";
import { get } from "lodash/fp";
import React from "react";
import { CONTACT_US_LINK } from "~/components/utils/documentationLinks";
import { formatFileSize } from "~/components/utils/format";
import { openUrl } from "~/components/utils/links";
import { WORKFLOWS } from "~/components/utils/workflows";
import {
  BULK_DOWNLOAD_TYPES,
  getDownloadDisplayName,
  getStatusDisplay,
  InProgressStatus,
} from "~/components/views/BulkDownloadListView/constants";
import { BulkDownloadStatus } from "~/interface/shared";
import LoadingBar from "~ui/controls/LoadingBar";
import StatusLabel from "~ui/labels/StatusLabel";
import cs from "./bulk_download_table_renderers.scss";

export class BulkDownloadTableRenderers extends React.Component {
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
              {getDownloadDisplayName(rowData.downloadType)}
            </div>
            <StatusLabel
              className={cs.downloadStatus}
              status={getStatusDisplay(rowData.status)}
              type={rowData.statusType}
              tooltipText={rowData.tooltipText}
            />
          </div>
          <div className={cs.metadata}>
            <span
              className={cs.detailsLink}
              onClick={rowData.onDetailsClick}
              data-testid={"download-details-link"}
              id={rowData?.id}
            >
              Details
            </span>
            {admin && (
              <React.Fragment>
                |
                <span className={cs.userName}>
                  User Id: {rowData.ownerUserId}
                </span>
              </React.Fragment>
            )}
          </div>
        </div>
      </div>
    );
  };

  static renderCount = ({ rowData }) => {
    const bulkDownloadType = get("downloadType", rowData);
    const count = get("analysisCount", rowData);

    let analysisTypeString = count === 1 ? "Sample" : "Samples";
    if (bulkDownloadType !== BULK_DOWNLOAD_TYPES.SAMPLE_METADATA) {
      const workflowLabelField = count === 1 ? "label" : "pluralizedLabel";
      const workflowObj = WORKFLOWS[get("entityInputFileType", rowData)];

      analysisTypeString = get(workflowLabelField, workflowObj);
    }

    return <div>{`${count} ${analysisTypeString}`}</div>;
  };

  static renderStatus = ({ rowData }) => {
    const { status, url } = rowData;
    if (status === BulkDownloadStatus.SUCCEEDED && url) {
      return (
        <div className={cs.statusCell}>
          <div className={cs.links}>
            <div
              id={rowData?.id}
              className={cs.link}
              onClick={() => openUrl(url)}
            >
              Download File
            </div>
          </div>
        </div>
      );
    }
    if (InProgressStatus.includes(status)) {
      return (
        <div className={cs.statusCell} id={rowData?.id}>
          <LoadingBar showHint tiny />
        </div>
      );
    }

    return (
      <div className={cs.statusCell}>
        <div className={cs.links}>
          <a
            id={rowData?.id}
            className={cs.link}
            href={CONTACT_US_LINK}
            target="_blank"
            rel="noopener noreferrer"
          >
            Contact us
          </a>
        </div>
      </div>
    );
  };

  static renderFileSize = ({ rowData }) => {
    const { fileSize } = rowData;
    if (typeof fileSize !== "number" || isNaN(fileSize)) {
      return null;
    }
    return (
      <>{formatFileSize(fileSize, ["Bytes", "KB", "MB", "GB", "TB"], 2)}</>
    );
  };
}
