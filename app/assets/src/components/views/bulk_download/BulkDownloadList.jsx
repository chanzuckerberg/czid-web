import React from "react";
import cx from "classnames";
import { SortDirection } from "react-virtualized";

import LargeDownloadIcon from "~ui/icons/LargeDownloadIcon";
import LoadingMessage from "~/components/common/LoadingMessage";
import { getBulkDownloads } from "~/api/bulk_downloads";
import { ViewHeader, NarrowContainer, Divider } from "~/components/layout";
import TableRenderers from "~/components/views/discovery/TableRenderers";
import BlankScreenMessage from "~/components/common/BlankScreenMessage";
import { Table } from "~/components/visualizations/table";

import BulkDownloadTableRenderers from "./BulkDownloadTableRenderers";
import BulkDownloadDetailsModal from "./BulkDownloadDetailsModal";
import cs from "./bulk_download_list.scss";

const TABLE_COLUMNS = [
  {
    dataKey: "download_name",
    label: "Download",
    width: 500,
    flexGrow: 1,
    headerClassName: cs.downloadNameHeader,
    cellRenderer: BulkDownloadTableRenderers.renderDownload,
  },
  {
    dataKey: "created_at",
    label: "Created On",
    width: 120,
    flexGrow: 1,
    cellRenderer: TableRenderers.renderDateWithElapsed,
  },
  {
    dataKey: "status",
    label: "",
    width: 240,
    cellRenderer: BulkDownloadTableRenderers.renderStatus,
  },
];

class BulkDownloadList extends React.Component {
  state = {
    bulkDownloads: null,
    modalOpen: false,
    selectedBulkDownload: null,
  };

  async componentDidMount() {
    const bulkDownloads = await getBulkDownloads();

    this.setState({
      bulkDownloads: this.processBulkDownloads(bulkDownloads),
    });
  }

  processBulkDownloads = bulkDownloads =>
    bulkDownloads.map(bulkDownload => ({
      ...bulkDownload,
      // Add a callback for the cell. This is used in the renderDownload cell renderer.
      onStatusClick: () => this.onStatusClick(bulkDownload),
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

  onModalClose = () => {
    this.setState({
      modalOpen: false,
    });
  };

  renderBody() {
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
        <Table
          rowClassName={cs.tableRow}
          headerClassName={cs.tableHeader}
          className={cs.table}
          columns={TABLE_COLUMNS}
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

export default BulkDownloadList;
