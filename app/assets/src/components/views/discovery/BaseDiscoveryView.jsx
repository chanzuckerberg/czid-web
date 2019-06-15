import React from "react";
import PropTypes from "prop-types";

import { Table } from "~/components/visualizations/table";
// CSS file must be loaded after any elements you might want to override
import cs from "./base_discovery_view.scss";

class BaseDiscoveryView extends React.Component {
  // Note: This class guarantees that a couple of settings are synced
  // between views that use it (at the time of this comment, ProjectsView and VisualizationsView)
  // We might be able to get rid of it once we implement dynamic row height on the tables.
  render() {
    const {
      columns,
      data,
      handleRowClick,
      initialActiveColumns,
      protectedColumns,
    } = this.props;

    return (
      <Table
        columns={columns}
        data={data}
        defaultRowHeight={68}
        initialActiveColumns={initialActiveColumns}
        onRowClick={handleRowClick}
        protectedColumns={protectedColumns}
        rowClassName={cs.tableDataRow}
        sortable
      />
    );
  }
}

BaseDiscoveryView.defaultProps = {
  columns: [],
  data: [],
};

BaseDiscoveryView.propTypes = {
  columns: PropTypes.array,
  data: PropTypes.array,
  handleRowClick: PropTypes.func,
  initialActiveColumns: PropTypes.arrayOf(PropTypes.string),
  protectedColumns: PropTypes.arrayOf(PropTypes.string),
};

export default BaseDiscoveryView;
