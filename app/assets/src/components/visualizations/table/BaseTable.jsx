import React from "react";
import PropTypes from "prop-types";
import {
  AutoSizer,
  Column,
  Table as VirtualizedTable,
} from "react-virtualized";
import "react-virtualized/styles.css";
import cx from "classnames";
import { concat, difference, find, includes, map } from "lodash/fp";

import BasicPopup from "~/components/BasicPopup";
import Checkbox from "~ui/controls/Checkbox";
import MultipleDropdown from "~ui/controls/dropdowns/MultipleDropdown";
import PlusIcon from "~ui/icons/PlusIcon";
import SortIcon from "~ui/icons/SortIcon";
import { humanize } from "~/helpers/strings";
import { logAnalyticsEvent } from "~/api/analytics";

import cs from "./base_table.scss";

class BaseTable extends React.Component {
  // This class is a wrapper class to React Virtualized Table.
  // Sets some default values and style to guarantee consistency of
  // tables accross the site.
  // TODO: - limitations -
  // - needs dynamic row height (dynamic required use of CellMeasurer)

  constructor(props) {
    super(props);

    this.state = {
      activeColumns: this.props.initialActiveColumns,
      columns: BaseTable.setColumnDefaults(
        this.props.columns,
        this.props.defaultColumnWidth
      ),
    };
  }

  // Need to update the columns immediately, otherwise there will be a render
  // where the data has been updated but the columns haven't.
  static getDerivedStateFromProps(props, state) {
    if (props.columns !== state.prevPropsColumns) {
      return {
        activeColumns: props.initialActiveColumns,
        columns: BaseTable.setColumnDefaults(
          props.columns,
          props.defaultColumnWidth
        ),
        prevPropsColumns: props.columns,
      };
    }
    return null;
  }

  // Add defaults to the columns.
  static setColumnDefaults(columns, defaultColumnWidth) {
    return columns.map(column => {
      column.label =
        column.label !== undefined ? column.label : humanize(column.dataKey);
      column.width = column.width || defaultColumnWidth;
      return column;
    });
  }

  basicHeaderRenderer({ label }) {
    return (
      <BasicPopup
        trigger={<span className={cs.label}>{label}</span>}
        content={label}
      />
    );
  }

  _sortableHeaderRenderer({ dataKey, label, sortBy, sortDirection }) {
    return (
      <BasicPopup
        trigger={
          <div className={cs.sortableHeader}>
            <span className={cs.label}>{label}</span>
            {sortBy === dataKey && (
              <SortIcon
                sortDirection={
                  sortDirection === "ASC" ? "ascending" : "descending"
                }
                className={cs.sortIcon}
              />
            )}
          </div>
        }
        content={label}
      />
    );
  }

  handleColumnChange = selectedColumns => {
    const { protectedColumns } = this.props;
    this.setState({ activeColumns: concat(protectedColumns, selectedColumns) });
    logAnalyticsEvent("BaseTable_column-selector_changed", {
      selectedColumns: selectedColumns.length,
      protectedColumns: protectedColumns.length,
    });
  };

  renderColumnSelector = () => {
    const { activeColumns, columns } = this.state;
    const { protectedColumns } = this.props;

    const options = columns
      .filter(column => !includes(column.dataKey, protectedColumns))
      .map(column => ({
        value: column.dataKey,
        text: column.label,
      }));

    const value = difference(activeColumns, protectedColumns);

    return (
      <BasicPopup
        trigger={
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
            value={value}
          />
        }
        content="Select Columns"
      />
    );
  };

  renderSelectableCell = ({ cellData }) => {
    const { selected, onSelectRow } = this.props;
    const disabled = cellData === null || cellData === undefined;
    return (
      <Checkbox
        checked={selected.has(cellData)}
        onChange={onSelectRow}
        value={disabled ? -1 : cellData}
        disabled={disabled}
      />
    );
  };

  renderSelectableHeader = () => {
    const { selectAllChecked, onSelectAllRows } = this.props;
    return (
      <Checkbox
        checked={selectAllChecked}
        onChange={(_value, checked, _event) => onSelectAllRows(checked)}
        value={"all"}
      />
    );
  };

  render() {
    const {
      defaultCellRenderer,
      defaultHeaderHeight,
      defaultRowHeight,
      defaultSelectColumnWidth,
      forwardRef,
      headerClassName,
      initialActiveColumns,
      onRowClick,
      onRowsRendered,
      onSort,
      rowClassName,
      rowCount,
      rowGetter,
      rowRenderer,
      selectableColumnClassName,
      selectableKey,
      sortable,
      sortBy,
      sortDirection,
      ...extraTableProps
    } = this.props;

    const { activeColumns, columns } = this.state;
    const columnOrder = activeColumns || map("dataKey", columns);
    return (
      <div className={cs.tableContainer}>
        <AutoSizer>
          {({ width, height }) => (
            <VirtualizedTable
              gridClassName={cs.grid}
              headerClassName={cx(cs.header, headerClassName)}
              headerHeight={defaultHeaderHeight}
              height={height}
              onRowsRendered={onRowsRendered}
              ref={forwardRef}
              rowClassName={cx(
                rowClassName,
                cs.row,
                onRowClick && cs.clickable
              )}
              rowCount={rowCount}
              rowGetter={rowGetter}
              rowHeight={defaultRowHeight}
              rowRenderer={rowRenderer}
              sort={sortable && onSort}
              sortBy={sortable && sortBy}
              sortDirection={sortable && sortDirection}
              width={width}
              onRowClick={onRowClick}
              {...extraTableProps}
            >
              {selectableKey && (
                <Column
                  className={selectableColumnClassName}
                  dataKey={selectableKey}
                  headerRenderer={this.renderSelectableHeader}
                  cellRenderer={this.renderSelectableCell}
                  disableSort={true}
                  width={defaultSelectColumnWidth}
                />
              )}
              {columnOrder.map(dataKey => {
                const columnProps = find({ dataKey: dataKey }, columns);
                const { cellRenderer, className, ...extraProps } = columnProps;
                return (
                  <Column
                    className={cx(cs.cell, className)}
                    key={columnProps.dataKey}
                    headerRenderer={
                      sortable && !columnProps.disableSort
                        ? this._sortableHeaderRenderer
                        : this.basicHeaderRenderer
                    }
                    cellRenderer={cellRenderer || defaultCellRenderer}
                    {...extraProps}
                  />
                );
              })}
              {initialActiveColumns && (
                <Column dataKey={"plusPlaceholder"} width={20} />
              )}
            </VirtualizedTable>
          )}
        </AutoSizer>
        {/*
          We cannot add these as columns because it gets rerendered every time we add
          a column, causing the dropdown to close.
         */}
        {initialActiveColumns && (
          <div
            style={{ height: defaultHeaderHeight }}
            className={cx(
              cs.columnSelector,
              cs.row,
              "ReactVirtualized__Table__headerRow"
            )}
          >
            {this.renderColumnSelector()}
          </div>
        )}
      </div>
    );
  }
}

BaseTable.defaultProps = {
  defaultColumnWidth: 60,
  defaultHeaderHeight: 50,
  defaultRowHeight: 30,
  defaultSelectColumnWidth: 30,
  selected: new Set(),
};

BaseTable.propTypes = {
  columns: PropTypes.arrayOf(
    PropTypes.shape({
      dataKey: PropTypes.string.isRequired,
    })
  ).isRequired,
  defaultCellRenderer: PropTypes.func,
  defaultColumnWidth: PropTypes.number,
  defaultHeaderHeight: PropTypes.number,
  defaultRowHeight: PropTypes.oneOfType([PropTypes.number, PropTypes.func]),
  defaultSelectColumnWidth: PropTypes.number,
  headerClassName: PropTypes.string,
  // Set of dataKeys of columns to be shown by default
  initialActiveColumns: PropTypes.arrayOf(PropTypes.string),
  onRowClick: PropTypes.func,
  onRowsRendered: PropTypes.func,
  onSort: PropTypes.func,
  protectedColumns: PropTypes.arrayOf(PropTypes.string),
  forwardRef: PropTypes.oneOfType([
    PropTypes.func,
    PropTypes.shape({ current: PropTypes.instanceOf(Element) }),
  ]),
  rowClassName: PropTypes.string,
  rowGetter: PropTypes.func.isRequired,
  rowCount: PropTypes.number.isRequired,
  rowRenderer: PropTypes.func,
  sortable: PropTypes.bool,
  sortBy: PropTypes.string,
  sortDirection: PropTypes.string,

  selectableColumnClassName: PropTypes.string,
  // make the table selectable, by setting a selectable key
  // the tables will check for the selectable key in the selected set/array
  selectableKey: PropTypes.string,
  selected: PropTypes.instanceOf(Set),
  onSelectRow: PropTypes.func,
  onSelectAllRows: PropTypes.func,
  selectAllChecked: PropTypes.bool,
};

export default BaseTable;
