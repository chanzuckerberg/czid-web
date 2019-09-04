import React from "react";
import PropTypes from "prop-types";
import cx from "classnames";

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
      headerClassName,
      initialActiveColumns,
      protectedColumns,
      rowClassName,
      rowHeight,
    } = this.props;

    return (
      <Table
        columns={columns}
        data={data}
        defaultRowHeight={rowHeight}
        headerClassName={headerClassName}
        initialActiveColumns={initialActiveColumns}
        onRowClick={handleRowClick}
        protectedColumns={protectedColumns}
        rowClassName={cx(cs.tableDataRow, rowClassName)}
        sortable
      />
    );
  }
}

BaseDiscoveryView.defaultProps = {
  columns: [],
  data: [],
  rowHeight: 68,
};

BaseDiscoveryView.propTypes = {
  columns: PropTypes.array,
  data: PropTypes.array,
  handleRowClick: PropTypes.func,
  headerClassName: PropTypes.string,
  initialActiveColumns: PropTypes.arrayOf(PropTypes.string),
  protectedColumns: PropTypes.arrayOf(PropTypes.string),
  rowClassName: PropTypes.string,
  rowHeight: PropTypes.oneOfType([PropTypes.number, PropTypes.func]),
};

export default BaseDiscoveryView;
