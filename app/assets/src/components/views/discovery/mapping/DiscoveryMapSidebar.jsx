import React from "react";
import cx from "classnames";

import PropTypes from "~/components/utils/propTypes";
import InfiniteTable from "~/components/visualizations/table/InfiniteTable";
import TableRenderers from "~/components/views/discovery/TableRenderers";

import cs from "./discovery_map_sidebar.scss";

export default class DiscoveryMapSidebar extends React.Component {
  constructor(props) {
    super(props);

    this.columns = [
      {
        dataKey: "sample",
        flexGrow: 1,
        width: 350,
        cellRenderer: this.renderSample,
        headerClassName: cs.sampleHeader
      },
      {
        dataKey: "createdAt",
        label: "Uploaded On",
        width: 120,
        className: cs.basicCell,
        cellRenderer: TableRenderers.renderDateWithElapsed
      },
      {
        dataKey: "host",
        flexGrow: 1,
        className: cs.basicCell
      },
      {
        dataKey: "collectionLocation",
        label: "Location",
        flexGrow: 1,
        className: cs.basicCell
      },
      {
        dataKey: "totalReads",
        label: "Total Reads",
        flexGrow: 1,
        className: cs.basicCell,
        cellDataGetter: ({ dataKey, rowData }) =>
          this.formatNumberWithCommas(rowData[dataKey])
      },
      {
        dataKey: "nonHostReads",
        label: "Passed Filters",
        flexGrow: 1,
        className: cs.basicCell,
        cellRenderer: this.renderNumberAndPercentage
      },
      {
        dataKey: "qcPercent",
        label: "Passed QC",
        flexGrow: 1,
        className: cs.basicCell,
        cellDataGetter: ({ dataKey, rowData }) =>
          this.formatPercentage(rowData[dataKey])
      },
      {
        dataKey: "duplicateCompressionRatio",
        label: "DCR",
        flexGrow: 1,
        className: cs.basicCell,
        cellDataGetter: ({ dataKey, rowData }) =>
          this.formatPercentage(rowData[dataKey])
      },
      {
        dataKey: "erccReads",
        label: "ERCC Reads",
        flexGrow: 1,
        className: cs.basicCell,
        cellDataGetter: ({ dataKey, rowData }) =>
          this.formatNumberWithCommas(rowData[dataKey])
      },
      {
        dataKey: "notes",
        flexGrow: 1,
        className: cs.basicCell
      },
      {
        dataKey: "nucleotideType",
        label: "Nucleotide Type",
        flexGrow: 1,
        className: cs.basicCell
      },
      {
        dataKey: "sampleType",
        label: "Sample Type",
        flexGrow: 1,
        className: cs.basicCell
      },
      {
        dataKey: "subsampledFraction",
        label: "SubSampled Fraction",
        flexGrow: 1,
        className: cs.basicCell,
        cellDataGetter: ({ dataKey, rowData }) =>
          this.formatNumber(rowData[dataKey])
      },
      {
        dataKey: "totalRuntime",
        label: "Total Runtime",
        flexGrow: 1,
        className: cs.basicCell,
        cellDataGetter: ({ dataKey, rowData }) =>
          this.formatDuration(rowData[dataKey])
      }
    ];
  }

  handleLoadSampleRows = () => {
    const { samples } = this.props;
    console.log("handle load sample rows called");
    return samples;
  };

  renderTable = () => {
    const { activeColumns } = this.props;
    // const { selectedSampleIds } = this.state;

    // TODO(tiago): replace by automated cell height computing
    const rowHeight = 66;
    // const selectAllChecked = this.isSelectAllChecked();
    return (
      <div className={cs.table}>
        <InfiniteTable
          ref={infiniteTable => (this.infiniteTable = infiniteTable)}
          columns={this.columns}
          defaultRowHeight={rowHeight}
          initialActiveColumns={activeColumns}
          // loadingClassName={cs.loading}
          onLoadRows={this.handleLoadSampleRows}
          // onSelectAllRows={withAnalytics(
          //   this.handleSelectAllRows,
          //   "SamplesView_select-all-rows_clicked"
          // )}
          // onSelectRow={this.handleSelectRow}
          // onRowClick={this.handleRowClick}
          // protectedColumns={protectedColumns}
          // rowClassName={cs.tableDataRow}
          // selectableKey="id"
          // selected={selectedSampleIds}
          // selectAllChecked={selectAllChecked}
        />
      </div>
    );
  };

  render() {
    const { className, samples } = this.props;

    console.log("foobar 6:09pm", samples);

    this.infiniteTable && this.infiniteTable.reset();

    return (
      <div className={cx(className, cs.sidebar)}>{this.renderTable()}</div>
    );
  }
}

DiscoveryMapSidebar.defaultProps = {
  activeColumns: ["sample", "nonHostReads"]
};

DiscoveryMapSidebar.propTypes = {
  className: PropTypes.string,
  samples: PropTypes.array,
  activeColumns: PropTypes.array
};
