import cx from "classnames";
import { InputText } from "czifui";
import { some } from "lodash/fp";
import React from "react";
import { SortDirection } from "react-virtualized";
import { trackEvent, withAnalytics } from "~/api/analytics";
import { getBulkDownloads, getPresignedOutputUrl } from "~/api/bulk_downloads";
import { selectedBulkDownloadVar } from "~/cache/initialCache";
import BlankScreenMessage from "~/components/common/BlankScreenMessage";
import DetailsSidebar from "~/components/common/DetailsSidebar";
import LoadingMessage from "~/components/common/LoadingMessage";
import { UserContext } from "~/components/common/UserContext";
import { Divider, NarrowContainer, ViewHeader } from "~/components/layout";
import Label from "~/components/ui/labels/Label";
import { APOLLO_CLIENT_STATE_MANAGEMENT } from "~/components/utils/features";
import TableRenderers from "~/components/views/discovery/TableRenderers";
import { Table } from "~/components/visualizations/table";
import { BulkDownloadDetails } from "~/interface/shared";
import ImgDownloadPrimary from "~ui/illustrations/ImgDownloadPrimary";
import Notification from "~ui/notifications/Notification";
import { openUrl } from "~utils/links";
import cs from "./bulk_download_list.scss";
import BulkDownloadTableRenderers from "./BulkDownloadTableRenderers";

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
const getStatusType = (bulkDownload: $TSFixMe) => {
  if (bulkDownload.status === "success" && bulkDownload.error_message) {
    return "warning";
  }
  return STATUS_TYPES[bulkDownload.status];
};

const getStatusDisplay = (bulkDownload: $TSFixMe) => {
  if (bulkDownload.status === "success" && bulkDownload.error_message) {
    return "complete with issue";
  }
  return STATUS_DISPLAY[bulkDownload.status];
};

const getTooltipText = (bulkDownload: $TSFixMe) => {
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
    sidebarOpen: false,
    searchBy: null,
    searchLimit: null,
  };

  get urlParams() {
    return new URL(window.location.href).searchParams;
  }

  componentDidMount() {
    this.setState({
      searchBy: this.urlParams.get("searchBy"),
      searchLimit: this.urlParams.get("n"),
    });
    this.autoUpdateBulkDownloads();
  }

  initiateAutoUpdate = () => {
    this.setState({
      autoUpdateCount: 0,
    });

    this.autoUpdateBulkDownloads();
  };

  autoUpdateBulkDownloads = async () => {
    const bulkDownloads = await getBulkDownloads({
      searchBy: this.urlParams.get("searchBy"),
      n: this.urlParams.get("n"),
    });
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
        cellRenderer: (cellData: $TSFixMe) =>
          BulkDownloadTableRenderers.renderDownload(cellData, admin),
      },
      {
        dataKey: "created_at",
        label: "Date",
        width: 200,
        cellRenderer: TableRenderers.renderDateWithElapsed,
      },
      {
        dataKey: "analysis_count",
        label: "Count",
        width: 180,
        cellRenderer: BulkDownloadTableRenderers.renderCount,
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
        width: 120,
        cellRenderer: BulkDownloadTableRenderers.renderStatus,
        disableSort: true,
      },
    ];
  };

  hasInProgressBulkDownloads = () =>
    some(["status", "running"], this.state.bulkDownloads);

  processBulkDownloads = (bulkDownloads: $TSFixMe) =>
    bulkDownloads.map((bulkDownload: $TSFixMe) => ({
      ...bulkDownload,
      // Add callback to be used in renderDownload table renderer.
      onStatusClick: () => {
        trackEvent("BulkDownloadList_details-link_clicked", {
          bulkDownloadId: bulkDownload.id,
        });
        this.handleStatusClick(bulkDownload);
      },
      // Add callbacks to be used in renderStatus table renderer.
      onDownloadFileClick: () => {
        trackEvent("BulkDownloadList_direct-download-link_clicked", {
          bulkDownloadId: bulkDownload.id,
        });
        this.handleDownloadFileClick(bulkDownload);
      },
      statusType: getStatusType(bulkDownload),
      statusDisplay: getStatusDisplay(bulkDownload),
      tooltipText: getTooltipText(bulkDownload),
    }));

  isLoading = () => this.state.bulkDownloads === null;
  isEmpty = () =>
    this.state.bulkDownloads && this.state.bulkDownloads.length === 0;

  handleStatusClick = (bulkDownload: BulkDownloadDetails) => {
    const { allowedFeatures } = this.context || {};
    const apolloClientEnabled = allowedFeatures.includes(
      APOLLO_CLIENT_STATE_MANAGEMENT,
    );

    if (apolloClientEnabled) {
      selectedBulkDownloadVar({ bulkDownload: bulkDownload });
    }
    this.setState({
      selectedBulkDownload: bulkDownload,
      sidebarOpen: true,
    });
  };

  handleDownloadFileClick = async (bulkDownload: $TSFixMe) => {
    // This should only be clickable when the bulk download has succeeded
    // TODO(mark): Handle error case.
    if (bulkDownload.status === "success") {
      const outputFilePresignedUrl = await getPresignedOutputUrl(
        bulkDownload.id,
      );
      openUrl(outputFilePresignedUrl);
    }
  };

  handleSidebarClose = () => {
    this.setState({
      sidebarOpen: false,
    });
  };

  getSidebarParams = () => {
    return {
      bulkDownload: this.state.selectedBulkDownload,
    };
  };

  handleSearchKeyDown = event => {
    if (event.key === "Enter") {
      const { searchBy, searchLimit } = this.state;
      window.location.href = `/bulk_downloads?searchBy=${searchBy}&n=${searchLimit}`;
    }
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
            icon={<ImgDownloadPrimary className={cs.largeDownloadIcon} />}
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
              type="warning"
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
    const { admin } = this.context;
    const { selectedBulkDownload, sidebarOpen } = this.state;

    return (
      <div
        className={cx(
          cs.bulkDownloadList,
          this.isEmpty() && cs.empty,
          this.isLoading() && cs.loading,
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
            <ViewHeader.Controls>
              {admin && (
                <>
                  <Label text="Admin Settings" color="blue" size="mini" />
                  <br />
                  <small>Show downloads for:</small>
                  <InputText
                    sdsType="textField"
                    size="small"
                    id="searchBy"
                    label="Show downloads for"
                    hideLabel
                    defaultValue={this.urlParams.get("searchBy")}
                    onChange={e => this.setState({ searchBy: e.target.value })}
                    onKeyDown={this.handleSearchKeyDown}
                  />
                  <small>Downloads to show:</small>
                  <InputText
                    sdsType="textField"
                    size="small"
                    id="n"
                    label="Downloads to show"
                    hideLabel
                    defaultValue={this.urlParams.get("n")}
                    onChange={e =>
                      this.setState({ searchLimit: e.target.value })
                    }
                    onKeyDown={this.handleSearchKeyDown}
                  />
                </>
              )}
            </ViewHeader.Controls>
          </ViewHeader>
        </NarrowContainer>
        <Divider />
        {this.renderBody()}
        <DetailsSidebar
          visible={sidebarOpen}
          mode="bulkDownloadDetails"
          onClose={withAnalytics(
            this.handleSidebarClose,
            "BulkDownloadList_details-sidebar_closed",
            {
              bulkDownloadId: selectedBulkDownload && selectedBulkDownload.id,
            },
          )}
          params={this.getSidebarParams()}
        />
      </div>
    );
  }
}

BulkDownloadList.contextType = UserContext;

export default BulkDownloadList;
