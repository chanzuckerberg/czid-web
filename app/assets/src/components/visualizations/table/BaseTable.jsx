import cx from "classnames";
import { concat, difference, find, includes, map } from "lodash/fp";
import PropTypes from "prop-types";
import React from "react";
import Draggable from "react-draggable";
import {
  AutoSizer,
  Column,
  Table as VirtualizedTable,
} from "react-virtualized";
import "react-virtualized/styles.css";

import { logAnalyticsEvent } from "~/api/analytics";
import BasicPopup from "~/components/BasicPopup";
import { UserContext } from "~/components/common/UserContext";
import ColumnHeaderTooltip from "~/components/ui/containers/ColumnHeaderTooltip";
import { DRAGGABLE_COLUMNS_FEATURE } from "~/components/utils/features";
import { humanize } from "~/helpers/strings";
import Checkbox from "~ui/controls/Checkbox";
import MultipleDropdown from "~ui/controls/dropdowns/MultipleDropdown";
import { IconPlusCircleSmall } from "~ui/icons";
import SortIcon from "~ui/icons/SortIcon";

import cs from "./base_table.scss";

class BaseTable extends React.Component {
  // This class is a wrapper class to React Virtualized Table.
  // Sets some default values and style to guarantee consistency of
  // tables accross the site.
  // TODO: - limitations -
  // - needs dynamic row height (dynamic required use of CellMeasurer)

  constructor(props, context) {
    super(props, context);

    this.state = {
      activeColumns: this.props.initialActiveColumns,
      columns: BaseTable.setColumnDefaults(
        this.props.columns,
        this.props.defaultColumnWidth,
      ),
      columnWidthPercentages: {},
      columnCurrentlyDragged: null,
      mouseOverDraggableAreaForColumn: null,
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
          props.defaultColumnWidth,
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

  basicHeaderRenderer = ({ columnData, label }) => {
    const { headerLabelClassName } = this.props;
    return (
      <div>
        {columnData ? (
          <ColumnHeaderTooltip
            trigger={
              <span className={cx(cs.label, headerLabelClassName)}>
                {label}
              </span>
            }
            title={label}
            content={columnData.tooltip}
            link={columnData.link}
          />
        ) : (
          <span className={cx(cs.label, headerLabelClassName)}>{label}</span>
        )}
      </div>
    );
  };

  draggableHeaderRenderer = ({
    dataKey,
    nextDataKey,
    columnData,
    label,
    totalTableWidth,
    totalTableHeight,
    isFirstColumn,
  }) => {
    const { headerLabelClassName } = this.props;
    const {
      columnCurrentlyDragged,
      mouseOverDraggableAreaForColumn,
    } = this.state;

    return (
      <React.Fragment key={dataKey}>
        {/*
          If the column is not the first column, add the empty div first so we can
          properly position the column name in the middle and the draggable component
          to the far right (alignment done via justify-content: space-between).
        */}
        {!isFirstColumn && <div />}
        {columnData ? (
          <ColumnHeaderTooltip
            trigger={
              <span className={cx(cs.label, headerLabelClassName)}>
                {label}
              </span>
            }
            title={label}
            content={columnData.tooltip}
            link={columnData.link}
          />
        ) : (
          <span className={cx(cs.label, headerLabelClassName)}>{label}</span>
        )}
        {/*
          If the column is the first column, align the header to the far left by putting an empty div
          in the middle of the label and draggable icon (alginment done via justify-content: space-between).
        */}
        {isFirstColumn && <div />}
        <Draggable
          axis="x"
          onDrag={(_, { deltaX }) =>
            this.resizeRow({
              dataKey,
              deltaX,
              nextDataKey,
              totalTableWidth,
            })
          }
          position={{ x: 0 }}
          onStart={() => this.setState({ columnCurrentlyDragged: dataKey })}
          onStop={() => this.setState({ columnCurrentlyDragged: null })}
        >
          <div
            className={cs.draggableArea}
            onMouseOver={() =>
              this.setState({ mouseOverDraggableAreaForColumn: dataKey })
            }
            onMouseLeave={() =>
              this.setState({ mouseOverDraggableAreaForColumn: null })
            }
          >
            <div className={cs.dragHandleIcon} />
            {(columnCurrentlyDragged === dataKey ||
              mouseOverDraggableAreaForColumn === dataKey) &&
              // The ruler is naturally centered in the draggableArea and does not start at the top of the table
              // and end at the bottom of the table by default.
              // To make the ruler start at the top of the table and end at the bottom of the table we must
              // transform/translate the Y cooridnate by half of the height (table height) minus the height of
              // the header cell (21px).
              this.displayRuler({
                height: totalTableHeight,
                additionalStyling: {
                  transform: `translate(0, ${totalTableHeight / 2 - 21}px)`,
                },
              })}
          </div>
        </Draggable>
      </React.Fragment>
    );
  };

  displayRuler = ({ height, additionalStyling = {} }) => {
    return (
      <div className={cs.ruler} style={{ height, ...additionalStyling }} />
    );
  };

  resizeRow = ({ dataKey, deltaX, nextDataKey, totalTableWidth }) => {
    const { columns } = this.state;

    this.setState(prevState => {
      const prevColumnWidthPercentages = prevState.columnWidthPercentages;
      // The amount of dragging the user has performed (as a percentage)
      const percentDelta = deltaX / totalTableWidth;

      return {
        columnWidthPercentages: {
          ...prevColumnWidthPercentages,
          [dataKey]:
            // If the previous column width percentage does not exist (happens when you haven't dragged a column yet)
            // calculate the percentage based on the column width / totalTableWidth.
            (prevColumnWidthPercentages[dataKey]
              ? prevColumnWidthPercentages[dataKey]
              : find({ dataKey }, columns).width / totalTableWidth) +
            percentDelta,
          // Compute the nextDataKey's width percentage as well since dragging a column affects the next column.
          [nextDataKey]:
            (prevColumnWidthPercentages[nextDataKey]
              ? prevColumnWidthPercentages[nextDataKey]
              : find({ dataKey: nextDataKey }, columns).width /
                totalTableWidth) - percentDelta,
        },
      };
    });
  };

  _sortableHeaderRenderer = ({
    columnData,
    dataKey,
    label,
    sortBy,
    sortDirection,
  }) => {
    const { sortedHeaderClassName } = this.props;
    return (
      <div
        className={cx(
          cs.sortableHeader,
          sortBy === dataKey && sortedHeaderClassName,
        )}
      >
        {columnData ? (
          <ColumnHeaderTooltip
            trigger={<span className={cs.label}>{label}</span>}
            title={label}
            content={columnData.tooltip}
            link={columnData.link}
          />
        ) : (
          <BasicPopup
            trigger={<span className={cs.label}>{label}</span>}
            content={label}
          />
        )}
        <SortIcon
          sortDirection={sortDirection === "ASC" ? "ascending" : "descending"}
          className={cx(cs.sortIcon, sortBy === dataKey && cs.active)}
        />
      </div>
    );
  };

  handleColumnChange = selectedColumns => {
    const { onActiveColumnsChange, protectedColumns } = this.props;
    this.setState(
      { activeColumns: concat(protectedColumns, selectedColumns) },
      () =>
        onActiveColumnsChange &&
        onActiveColumnsChange(this.state.activeColumns),
    );
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
            trigger={<IconPlusCircleSmall className={cs.plusIcon} />}
            value={value}
          />
        }
        content="Add or Remove Columns"
      />
    );
  };

  renderSelectableCell = ({ cellData }) => {
    const { selected, onSelectRow, selectableCellClassName } = this.props;
    const disabled = cellData === null || cellData === undefined;
    return (
      <Checkbox
        className={selectableCellClassName}
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
    const { allowedFeatures } = this.context || {};
    const {
      cellClassName,
      defaultCellRenderer,
      defaultHeaderHeight,
      defaultRowHeight,
      defaultSelectColumnWidth,
      draggableColumns,
      forwardRef,
      gridClassName,
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
    const { activeColumns, columns, columnWidthPercentages } = this.state;

    const columnOrder = activeColumns || map("dataKey", columns);
    const numberOfColumns = columnOrder.length;
    const draggableColumnsFeatureEnabled =
      allowedFeatures.includes(DRAGGABLE_COLUMNS_FEATURE) && draggableColumns;
    return (
      <div
        className={cs.tableContainer}
        style={{ flexBasis: defaultHeaderHeight }}
      >
        <AutoSizer>
          {({ width, height }) => (
            <VirtualizedTable
              gridClassName={cx(cs.grid, gridClassName)}
              headerClassName={cx(cs.header, headerClassName)}
              headerHeight={defaultHeaderHeight}
              height={height}
              onRowsRendered={onRowsRendered}
              ref={forwardRef}
              rowClassName={cx(
                rowClassName,
                cs.row,
                onRowClick && cs.clickable,
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
              {columnOrder.map((dataKey, index) => {
                const columnProps = find({ dataKey }, columns);
                if (!columnProps) {
                  console.error(
                    `${dataKey} was expected but not found in column config. Skipping.`,
                  );
                  return null;
                }

                const isLastColumn = index === numberOfColumns - 1;
                const {
                  cellRenderer,
                  className,
                  headerClassName,
                  // The px width value is destuctured here because we don't want it to override
                  // the width dervived from the percentage of the column * total width of the table.
                  // The column percentages are critical to the functionality of draggable columns.
                  width: pxWidth,
                  ...extraProps
                } = columnProps;

                let headerRenderer;
                if (sortable && !columnProps.disableSort) {
                  headerRenderer = this._sortableHeaderRenderer;
                } else if (
                  draggableColumnsFeatureEnabled &&
                  !columnProps.disableDrag &&
                  !isLastColumn
                ) {
                  headerRenderer = args =>
                    this.draggableHeaderRenderer({
                      // Columns first in the order are aligned left, all others are aligned in the center
                      isFirstColumn: index === 0,
                      totalTableWidth: width,
                      totalTableHeight: height,
                      nextDataKey: columnOrder[index + 1],
                      ...args,
                    });
                } else {
                  headerRenderer = this.basicHeaderRenderer;
                }

                return (
                  <Column
                    className={cx(cs.cell, cellClassName, className)}
                    columnData={columnProps.columnData}
                    key={dataKey}
                    // If the width percentage has not been calculated yet, use the default column width
                    width={
                      columnWidthPercentages[dataKey]
                        ? columnWidthPercentages[dataKey] * width
                        : pxWidth
                    }
                    headerRenderer={headerRenderer}
                    cellRenderer={cellRenderer || defaultCellRenderer}
                    headerClassName={cx(
                      headerClassName,
                      draggableColumnsFeatureEnabled && !isLastColumn
                        ? cs.draggableHeader
                        : "",
                    )}
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
              "ReactVirtualized__Table__headerRow",
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
  draggableColumns: false,
};

BaseTable.propTypes = {
  cellClassName: PropTypes.string,
  columns: PropTypes.arrayOf(
    PropTypes.shape({
      dataKey: PropTypes.string.isRequired,
    }),
  ).isRequired,
  defaultCellRenderer: PropTypes.func,
  defaultColumnWidth: PropTypes.number,
  defaultHeaderHeight: PropTypes.number,
  defaultRowHeight: PropTypes.oneOfType([PropTypes.number, PropTypes.func]),
  defaultSelectColumnWidth: PropTypes.number,
  draggableColumns: PropTypes.bool,
  gridClassName: PropTypes.string,
  headerClassName: PropTypes.string,
  headerLabelClassName: PropTypes.string,
  // Set of dataKeys of columns to be shown by default
  initialActiveColumns: PropTypes.arrayOf(PropTypes.string),
  onActiveColumnsChange: PropTypes.func,
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
  selectableCellClassName: PropTypes.string,
  selectableColumnClassName: PropTypes.string,
  sortable: PropTypes.bool,
  sortBy: PropTypes.string,
  sortDirection: PropTypes.string,
  sortedHeaderClassName: PropTypes.string,

  // make the table selectable, by setting a selectable key
  // the tables will check for the selectable key in the selected set/array
  selectableKey: PropTypes.string,
  selected: PropTypes.instanceOf(Set),
  onSelectRow: PropTypes.func,
  onSelectAllRows: PropTypes.func,
  selectAllChecked: PropTypes.bool,
};

BaseTable.contextType = UserContext;

export default BaseTable;
