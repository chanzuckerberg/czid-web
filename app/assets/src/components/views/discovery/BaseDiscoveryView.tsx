import cx from "classnames";
import React from "react";
import { SortDirectionType } from "react-virtualized";
import InfiniteTable from "~/components/visualizations/table/InfiniteTable";
// CSS file must be loaded after any elements you might want to override
import cs from "./base_discovery_view.scss";
import csTableRenderer from "./table_renderers.scss";

interface BaseDiscoveryViewProps {
  columns?: $TSFixMeUnknown[];
  data?: $TSFixMeUnknown[];
  handleRowClick?: $TSFixMeFunction;
  headerClassName?: string;
  initialActiveColumns?: string[];
  onLoadRows: $TSFixMeFunction;
  onSortColumn?: $TSFixMeFunction;
  protectedColumns?: string[];
  rowClassName?: string;
  rowHeight?: number | ((index: { index: number; row: any }) => number);
  sortable?: boolean;
  sortBy?: string;
  sortDirection?: SortDirectionType;
}

class BaseDiscoveryView extends React.Component<BaseDiscoveryViewProps> {
  // Note: This class guarantees that a couple of settings are synced
  // between views that use it (at the time of this comment, ProjectsView and VisualizationsView)
  // We might be able to get rid of it once we implement dynamic row height on the tables.
  infiniteTable: $TSFixMe;
  constructor(props: BaseDiscoveryViewProps) {
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

// @ts-expect-error ts-migrate(2339) FIXME: Property 'defaultProps' does not exist on type 'ty... Remove this comment to see the full error message
BaseDiscoveryView.defaultProps = {
  columns: [],
  data: [],
  rowHeight: 68,
};

export default BaseDiscoveryView;
