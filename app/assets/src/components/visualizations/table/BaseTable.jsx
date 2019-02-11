import React from "react";
import PropTypes from "prop-types";
import {
  AutoSizer,
  Column,
  SortDirection,
  SortIndicator,
  Table as VirtualizedTable
} from "react-virtualized";
import "react-virtualized/styles.css";
import { find, orderBy } from "lodash";
import cs from "./base_table.scss";
import cx from "classnames";

class BaseTable extends React.Component {
  // This class is a wrapper class to React Virtualized Table.
  // Sets some default values and style to guarantee consistency of
  // tables accross the site.s
  // TODO: - limitations -
  // - needs dynamic row height (dynamic required use of CellMeasurer)
  // - needs infinite scrolling
  // - needs column picker
  // - needs selectable rows

  constructor(props) {
    super(props);

    this.state = {
      columns: this.setDefaults(this.props.columns),
      sortBy: this.props.sortBy,
      sortDirection: SortDirection.ASC
    };
  }

  humanize(key) {
    return key
      .split("_")
      .map(str => str.charAt(0).toUpperCase() + str.slice(1))
      .join(" ");
  }

  setDefaults = columns => {
    const { defaultColumnWidth } = this.props;
    return columns.map(column => {
      column.label =
        column.label !== undefined
          ? column.label
          : this.humanize(column.dataKey);
      column.width = column.width || defaultColumnWidth;
      return column;
    });
  };

  _sort = ({ sortBy, sortDirection }) => {
    this.setState({ sortBy, sortDirection });
  };

  _sortableHeaderRenderer({ dataKey, label, sortBy, sortDirection }) {
    return (
      <div>
        {label}
        {sortBy === dataKey && <SortIndicator sortDirection={sortDirection} />}
      </div>
    );
  }

  render() {
    const {
      data,
      defaultHeaderHeight,
      defaultRowHeight,
      onRowsRendered,
      forwardRef,
      sortable
    } = this.props;

    const { columns, sortBy, sortDirection } = this.state;

    let columnSortFunction = (find(columns, { dataKey: sortBy }) || {})
      .sortFunction;
    const sortedData =
      sortable && sortBy
        ? orderBy(
            data,
            [
              columnSortFunction
                ? row => columnSortFunction(row[sortBy])
                : sortBy
            ],
            [sortDirection === SortDirection.ASC ? "asc" : "desc"]
          )
        : data;

    return (
      <AutoSizer>
        {({ width, height }) => (
          <VirtualizedTable
            gridClassName={cs.grid}
            headerClassName={cs.header}
            headerHeight={defaultHeaderHeight}
            height={height}
            onRowsRendered={onRowsRendered}
            ref={forwardRef}
            rowClassName={cs.row}
            rowCount={data.length}
            rowGetter={({ index }) => sortedData[index]}
            rowHeight={defaultRowHeight}
            sort={sortable && this._sort}
            sortBy={sortable && sortBy}
            sortDirection={sortable && sortDirection}
            width={width}
          >
            {columns.map(columnProps => {
              const { className, ...extraProps } = columnProps;
              return (
                <Column
                  className={cx(cs.cell, className)}
                  key={columnProps.dataKey}
                  headerRenderer={
                    sortable && !columnProps.disableSort
                      ? this._sortableHeaderRenderer
                      : undefined
                  }
                  {...extraProps}
                />
              );
            })}
          </VirtualizedTable>
        )}
      </AutoSizer>
    );
  }
}

BaseTable.defaultProps = {
  data: [],
  defaultColumnWidth: 100,
  defaultHeaderHeight: 50,
  defaultRowHeight: 30
};

BaseTable.propTypes = {
  columns: PropTypes.arrayOf(
    PropTypes.shape({
      dataKey: PropTypes.string.isRequired
    })
  ).isRequired,
  data: PropTypes.array,
  defaultColumnWidth: PropTypes.number,
  defaultHeaderHeight: PropTypes.number,
  defaultRowHeight: PropTypes.number,
  onRowsRendered: PropTypes.func,
  forwardRef: PropTypes.oneOfType([
    PropTypes.func,
    PropTypes.shape({ current: PropTypes.instanceOf(Element) })
  ]),
  sortable: PropTypes.bool,
  sortBy: PropTypes.string
};

export default BaseTable;
