import cx from "classnames";
import PropTypes from "prop-types";
import React from "react";

import InfiniteTable from "~/components/visualizations/table/InfiniteTable";
// CSS file must be loaded after any elements you might want to override
import cs from "./base_discovery_view.scss";
import csTableRenderer from "./table_renderers.scss";

class BaseDiscoveryView extends React.Component {
  // Note: This class guarantees that a couple of settings are synced
  // between views that use it (at the time of this comment, ProjectsView and VisualizationsView)
  // We might be able to get rid of it once we implement dynamic row height on the tables.
  constructor(props) {
    super(props);
    this.infiniteTable = null;
  }

  reset = () => {
    this.infiniteTable && this.infiniteTable.reset();
  };

  render() {
    const {
      columns,
      handleRowClick,
      headerClassName,
      initialActiveColumns,
      onLoadRows,
      onSortColumn,
      protectedColumns,
      rowClassName,
      rowHeight,
      sortable,
      sortBy,
      sortDirection,
    } = this.props;
    return (
      <InfiniteTable
        columns={columns}
        defaultRowHeight={rowHeight}
        headerClassName={headerClassName}
        initialActiveColumns={initialActiveColumns}
        loadingClassName={csTableRenderer.loading}
        onLoadRows={onLoadRows}
        onRowClick={handleRowClick}
        onSortColumn={onSortColumn}
        protectedColumns={protectedColumns}
        ref={infiniteTable => (this.infiniteTable = infiniteTable)}
        rowClassName={cx(cs.tableDataRow, rowClassName)}
        sortable={sortable}
        sortBy={sortBy}
        sortDirection={sortDirection}
        draggableColumns
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
  onLoadRows: PropTypes.func.isRequired,
  onSortColumn: PropTypes.func,
  protectedColumns: PropTypes.arrayOf(PropTypes.string),
  rowClassName: PropTypes.string,
  rowHeight: PropTypes.oneOfType([PropTypes.number, PropTypes.func]),
  sortable: PropTypes.bool,
  sortBy: PropTypes.string,
  sortDirection: PropTypes.string,
};

export default BaseDiscoveryView;
