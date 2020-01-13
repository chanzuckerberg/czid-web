import React from "react";
import cx from "classnames";
import { SortDirection } from "react-virtualized";
import copy from "copy-to-clipboard";
import { some } from "lodash/fp";

import LargeDownloadIcon from "~ui/icons/LargeDownloadIcon";
import LoadingMessage from "~/components/common/LoadingMessage";
import { getBulkDownloads, getPresignedOutputUrl } from "~/api/bulk_downloads";
import { ViewHeader, NarrowContainer, Divider } from "~/components/layout";
import TableRenderers from "~/components/views/discovery/TableRenderers";
import BlankScreenMessage from "~/components/common/BlankScreenMessage";
import { Table } from "~/components/visualizations/table";
import { openUrl } from "~utils/links";
import { UserContext } from "~/components/common/UserContext";
import Notification from "~ui/notifications/Notification";

import BulkDownloadTableRenderers from "./BulkDownloadTableRenderers";
import BulkDownloadDetailsModal from "./BulkDownloadDetailsModal";
import cs from "./bulk_download_list.scss";

// The number of times we automatically update the bulk downloads on the page before prompting the user.
const AUTO_UPDATE_MAX_COUNT = 15;

// Slightly larger than PROGRESS_UPDATE_DELAY on the back-end.
const AUTO_UPDATE_DELAY = 20000;

const STATUS_TYPES = {
  waiting: "default",
  running: "default",
  success: "success",
  error: "error",
};

const STATUS_DISPLAY = {
  waiting: "in progress",
  running: "in progress",
  success: "complete",
  error: "failed",
};

// It is possible for a bulk download to "complete with issues".
// For example, a few of the source files could not be found, but the rest were compressed successfully.
// In this case, the bulk download task will have status = success and also have an error message.
const getStatusType = bulkDownload => {
  if (bulkDownload.status === "success" && bulkDownload.error_message) {
    return "warn";
  }
  return STATUS_TYPES[bulkDownload.status];
};

const getStatusDisplay = bulkDownload => {
  if (bulkDownload.status === "success" && bulkDownload.error_message) {
    return "complete with issue";
  }
  return STATUS_DISPLAY[bulkDownload.status];
};

const getTooltipText = bulkDownload => {
  if (bulkDownload.status === "success" && bulkDownload.error_message) {
    return bulkDownload.error_message;
  }

  return null;
};

class BulkDownloadList extends React.Component {
  state = {
    bulkDownloads: null,
    modalOpen: false,
    selectedBulkDownload: null,
    autoUpdateCount: 0,
  };

  componentDidMount() {
    this.autoUpdateBulkDownloads();
  }

  initiateAutoUpdate = () => {
    this.setState({
      autoUpdateCount: 0,
    });

    this.autoUpdateBulkDownloads();
  };

  autoUpdateBulkDownloads = async () => {
    const bulkDownloads = await getBulkDownloads();
    const newAutoUpdateCount = this.state.autoUpdateCount + 1;

    this.setState({
      bulkDownloads: this.processBulkDownloads(bulkDownloads),
      autoUpdateCount: newAutoUpdateCount,
    });

    if (
      newAutoUpdateCount < AUTO_UPDATE_MAX_COUNT &&
      this.hasInProgressBulkDownloads()
    ) {
      setTimeout(this.autoUpdateBulkDownloads, AUTO_UPDATE_DELAY);
    }
  };

  getTableColumns = () => {
    const { admin } = this.context || {};

    return [
      {
        dataKey: "download_name",
        label: "Download",
        width: 500,
        flexGrow: 1,
        headerClassName: cs.downloadNameHeader,
        cellRenderer: cellData =>
          BulkDownloadTableRenderers.renderDownload(cellData, admin),
      },
      {
        dataKey: "created_at",
        label: "Date",
        width: 200,
        cellRenderer: TableRenderers.renderDateWithElapsed,
      },
      {
        dataKey: "num_samples",
        label: "Samples",
        width: 100,
        cellRenderer: BulkDownloadTableRenderers.renderNumberOfSamples,
      },
      {
        dataKey: "file_size",
        label: "File Size",
        width: 200,
        className: cs.lightCell,
      },
      {
        dataKey: "status",
        label: "",
        width: 190,
        cellRenderer: BulkDownloadTableRenderers.renderStatus,
        disableSort: true,
      },
    ];
  };

  hasInProgressBulkDownloads = () =>
    some(["status", "running"], this.state.bulkDownloads);

  processBulkDownloads = bulkDownloads =>
    bulkDownloads.map(bulkDownload => ({
      ...bulkDownload,
      // Add callback to be used in renderDownload table renderer.
      onStatusClick: () => this.onStatusClick(bulkDownload),
      // Add callbacks to be used in renderStatus table renderer.
      onDownloadFileClick: () => this.onDownloadFileClick(bulkDownload),
      onCopyUrlClick: () => this.onCopyUrlClick(bulkDownload),
      statusType: getStatusType(bulkDownload),
      statusDisplay: getStatusDisplay(bulkDownload),
      tooltipText: getTooltipText(bulkDownload),
    }));

  isLoading = () => this.state.bulkDownloads === null;
  isEmpty = () =>
    this.state.bulkDownloads && this.state.bulkDownloads.length === 0;

  onStatusClick = bulkDownload => {
    this.setState({
      selectedBulkDownload: bulkDownload,
      modalOpen: true,
    });
  };

  onDownloadFileClick = async bulkDownload => {
    // This should only be clickable when the bulk download has succeeded
    // TODO(mark): Handle error case.
    if (bulkDownload.status === "success") {
      const outputFilePresignedUrl = await getPresignedOutputUrl(
        bulkDownload.id
      );
      openUrl(outputFilePresignedUrl);
    }
  };

  onCopyUrlClick = async bulkDownload => {
    // This should only be clickable when the bulk download has succeeded
    // TODO(mark): Handle error case. Want to change popup text, which involves a forceUpdate on the table.
    if (bulkDownload.status === "success") {
      const outputFilePresignedUrl = await getPresignedOutputUrl(
        bulkDownload.id
      );
      copy(outputFilePresignedUrl);
    }
  };

  onModalClose = () => {
    this.setState({
      modalOpen: false,
    });
  };

  renderBody() {
    const { autoUpdateCount } = this.state;

    if (this.isLoading()) {
      return (
        <LoadingMessage
          className={cs.loadingMessage}
          message="Loading Downloads"
        />
      );
    }

    if (this.isEmpty()) {
      return (
        <div className={cs.blankScreenContainer}>
          <BlankScreenMessage
            message="You don't have any bulk downloads yet"
            tagline="You can select samples from your data and request a download."
            icon={<LargeDownloadIcon className={cs.largeDownloadIcon} />}
            textWidth={260}
          />
        </div>
      );
    }

    return (
      <NarrowContainer className={cs.tableContainer}>
        {autoUpdateCount >= AUTO_UPDATE_MAX_COUNT &&
          this.hasInProgressBulkDownloads() && (
            <Notification
              type="warn"
              displayStyle="flat"
              className={cs.autoUpdateWarning}
            >
              This page is no longer auto-updating.{" "}
              <span onClick={this.initiateAutoUpdate} className={cs.link}>
                Click here to see additional updates.
              </span>
            </Notification>
          )}
        <Table
          rowClassName={cs.tableRow}
          headerClassName={cs.tableHeader}
          className={cs.table}
          columns={this.getTableColumns()}
          data={this.state.bulkDownloads}
          defaultRowHeight={70}
          sortable
          defaultSortBy="created_at"
          defaultSortDirection={SortDirection.DESC}
        />
      </NarrowContainer>
    );
  }

  render() {
    const { modalOpen, selectedBulkDownload } = this.state;
    return (
      <div
        className={cx(
          cs.bulkDownloadList,
          this.isEmpty() && cs.empty,
          this.isLoading() && cs.loading
        )}
      >
        <NarrowContainer>
          <ViewHeader className={cs.viewHeader}>
            <ViewHeader.Content>
              <ViewHeader.Pretitle breadcrumbLink={"/home"}>
                Back
              </ViewHeader.Pretitle>
              <ViewHeader.Title label={"Downloads"} />
            </ViewHeader.Content>
          </ViewHeader>
        </NarrowContainer>
        <Divider />
        {this.renderBody()}
        <BulkDownloadDetailsModal
          onClose={this.onModalClose}
          open={modalOpen}
          bulkDownload={selectedBulkDownload}
        />
      </div>
    );
  }
}

BulkDownloadList.contextType = UserContext;

export default BulkDownloadList;
