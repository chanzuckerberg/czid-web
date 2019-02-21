import React from "react";
import PropTypes from "prop-types";
import {
  AutoSizer,
  Column,
  SortIndicator,
  Table as VirtualizedTable
} from "react-virtualized";
import "react-virtualized/styles.css";
import MultipleDropdown from "~ui/controls/dropdowns/MultipleDropdown";
import PlusIcon from "~ui/icons/PlusIcon";
import { find, map } from "lodash";
import cs from "./base_table.scss";
import cx from "classnames";

class BaseTable extends React.Component {
  // This class is a wrapper class to React Virtualized Table.
  // Sets some default values and style to guarantee consistency of
  // tables accross the site.s
  // TODO: - limitations -
  // - needs dynamic row height (dynamic required use of CellMeasurer)
  // - needs selectable rows

  constructor(props) {
    super(props);

    // TOOD: move this to componentDidUpdate and remove from state?
    this.state = {
      activeColumns: this.props.initialActiveColumns,
      activeColumnsMenuOpen: false,
      columns: this.setDefaults(this.props.columns)
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

  _sortableHeaderRenderer({ dataKey, label, sortBy, sortDirection }) {
    return (
      <div>
        {label}
        {sortBy === dataKey && <SortIndicator sortDirection={sortDirection} />}
      </div>
    );
  }

  handleColumnChange = activeColumns => {
    this.setState({ activeColumns });
  };

  renderColumnSelector = () => {
    const { activeColumns, activeColumnsMenuOpen, columns } = this.state;

    const options = columns.map(column => ({
      value: column.dataKey,
      text: column.label
    }));

    return (
      <MultipleDropdown
        direction="left"
        hideArrow
        hideCounter
        rounded
        search
        checkedOnTop
        menuLabel="Select Columns"
        onChange={this.handleColumnChange}
        options={options}
        trigger={<PlusIcon className={cs.plusIcon} />}
        value={activeColumns}
      />
    );
  };

  render() {
    const {
      defaultCellRenderer,
      defaultHeaderHeight,
      defaultRowHeight,
      initialActiveColumns,
      onRowsRendered,
      forwardRef,
      onSort,
      rowCount,
      rowGetter,
      rowRenderer,
      sortable,
      sortBy,
      sortDirection
    } = this.props;

    const { activeColumns, columns } = this.state;
    const columnOrder = activeColumns || map(columns, "dataKey");
    return (
      <div className={cs.tableContainer}>
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
              rowCount={rowCount}
              rowGetter={rowGetter}
              rowHeight={defaultRowHeight}
              rowRenderer={rowRenderer}
              sort={sortable && onSort}
              sortBy={sortable && sortBy}
              sortDirection={sortable && sortDirection}
              width={width}
            >
              {columnOrder.map(dataKey => {
                const columnProps = find(columns, { dataKey: dataKey });
                const { cellRenderer, className, ...extraProps } = columnProps;
                return (
                  <Column
                    className={cx(cs.cell, className)}
                    key={columnProps.dataKey}
                    headerRenderer={
                      sortable && !columnProps.disableSort
                        ? this._sortableHeaderRenderer
                        : undefined
                    }
                    cellRenderer={cellRenderer || defaultCellRenderer}
                    {...extraProps}
                  />
                );
              })}
            </VirtualizedTable>
          )}
        </AutoSizer>
        {/*
          We cannot add these as columns because it gets rerendered every time we add a column,
          causing the dropdown to close.
         */}
        {initialActiveColumns && (
          <div
            style={{ height: defaultHeaderHeight }}
            className={cx(
              cs.columnSelectorContainer,
              cs.row,
              "ReactVirtualized__Table__headerRow"
            )}
          >
            <div
              style={{ height: 30 }}
              className={cx(
                cs.plusDropdown,
                cs.header,
                "ReactVirtualized__Table__headerColumn"
              )}
            >
              {this.renderColumnSelector()}
            </div>
          </div>
        )}
      </div>
    );
  }
}

BaseTable.defaultProps = {
  defaultColumnWidth: 60,
  defaultHeaderHeight: 50,
  defaultRowHeight: 30
};

BaseTable.propTypes = {
  columns: PropTypes.arrayOf(
    PropTypes.shape({
      dataKey: PropTypes.string.isRequired
    })
  ).isRequired,
  defaultCellRenderer: PropTypes.func,
  defaultColumnWidth: PropTypes.number,
  defaultHeaderHeight: PropTypes.number,
  defaultRowHeight: PropTypes.number,
  // Set of dataKeys of columns to be shown by default
  initialActiveColumns: PropTypes.arrayOf(PropTypes.string),
  onRowsRendered: PropTypes.func,
  onSort: PropTypes.func,
  forwardRef: PropTypes.oneOfType([
    PropTypes.func,
    PropTypes.shape({ current: PropTypes.instanceOf(Element) })
  ]),
  rowGetter: PropTypes.func.isRequired,
  rowCount: PropTypes.number.isRequired,
  rowRenderer: PropTypes.func,
  sortable: PropTypes.bool,
  sortBy: PropTypes.string,
  sortDirection: PropTypes.string
};

export default BaseTable;
