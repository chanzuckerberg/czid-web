import React from "react";
import cx from "classnames";

import PropTypes from "~/components/utils/propTypes";
import InfiniteTable from "~/components/visualizations/table/InfiniteTable";
import TableRenderers from "~/components/views/discovery/TableRenderers";
import SamplePublicIcon from "~ui/icons/SamplePublicIcon";
import SamplePrivateIcon from "~ui/icons/SamplePrivateIcon";
import BasicPopup from "~/components/BasicPopup";

import cs from "./discovery_map_sidebar.scss";
import SamplesView from "../../samples/SamplesView";

export default class DiscoveryMapSidebar extends React.Component {
  constructor(props) {
    super(props);
  }

  handleLoadSampleRows = async ({ startIndex, stopIndex }) => {
    const { samples } = this.props;
    console.log("handle load sample rows called");
    return samples;
  };

  renderTable = () => {
    const { activeColumns, samples } = this.props;
    // const { selectedSampleIds } = this.state;

    // TODO(tiago): replace by automated cell height computing
    const rowHeight = 66;
    // const selectAllChecked = this.isSelectAllChecked();
    console.log("I am in renderTable 2:59pm");
    console.log("the samples are: ", samples);
    console.log("columns: ", SamplesView.columns);
    return (
      <div className={cs.container}>
        <div className={cs.table}>
          <InfiniteTable
            ref={infiniteTable => (this.infiniteTable = infiniteTable)}
            columns={SamplesView.columns}
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
            rowClassName={cs.tableDataRow}
            // selectableKey="id"
            // selected={selectedSampleIds}
            // selectAllChecked={selectAllChecked}
          />
        </div>
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
