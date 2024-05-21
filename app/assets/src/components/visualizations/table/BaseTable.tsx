import { Icon } from "@czi-sds/components";
import cx from "classnames";
import { concat, difference, find, includes, kebabCase, map } from "lodash/fp";
import React from "react";
import {
  AutoSizer,
  Column,
  Index,
  SortDirectionType,
  Table as VirtualizedTable,
  TableCellProps,
} from "react-virtualized";
import "react-virtualized/styles.css";
import { TrackEventType, useTrackEvent } from "~/api/analytics";
import BasicPopup from "~/components/BasicPopup";
import ColumnHeaderTooltip from "~/components/ui/containers/ColumnHeaderTooltip";
import { humanize } from "~/helpers/strings";
import { ColumnProps } from "~/interface/sampleView";
import Checkbox from "~ui/controls/Checkbox";
import MultipleDropdown from "~ui/controls/dropdowns/MultipleDropdown";
import SortIcon from "~ui/icons/SortIcon";
import cs from "./base_table.scss";

export interface BaseTableProps {
  className?: string;
  cellClassName?: string;
  columns?: ColumnProps[];
  defaultCellRenderer?: $TSFixMeFunction;
  defaultColumnWidth?: number;
  defaultHeaderHeight?: number;
  defaultRowHeight?: number | ((params: Index) => number);
  defaultSelectColumnWidth?: number;
  draggableColumns?: boolean;
  gridClassName?: string;
  headerClassName?: string;
  headerHeight?: number;
  headerLabelClassName?: string;
  headerRowClassName?: string;
  // Set of dataKeys of columns to be shown by default
  initialActiveColumns?: string[];
  onActiveColumnsChange?: $TSFixMeFunction;
  onRowClick?: $TSFixMeFunction;
  onRowsRendered?: $TSFixMeFunction;
  onSort?: $TSFixMeFunction;
  protectedColumns?: string[];
  forwardRef?: (...args: $TSFixMeUnknown[]) =>
    | $TSFixMeUnknown
    | {
        current?: Element;
      };
  rowClassName?: string;
  rowHeight?: number | ((params: Index) => number);
  rowRenderer?: $TSFixMeFunction;
  selectableCellClassName?: string;
  selectableCellRenderer?: (x: $TSFixMeUnknown) => React.ReactNode;
  selectableColumnClassName?: string;
  sortable?: boolean;
  sortBy?: string;
  sortDirection?: SortDirectionType;
  // make the table selectable, by setting a selectable key
  // the tables will check for the selectable key in the selected set/array
  sortedHeaderClassName?: string;
  selectableKey?: string;
  selected?: Set<$TSFixMeUnknown>;
  onSelectRow?: $TSFixMeFunction;
  onSelectAllRows?: $TSFixMeFunction;
  selectAllChecked?: boolean;
  selectRowDataGetter?: $TSFixMeFunction;
}

interface BaseTableCalculatedProps extends BaseTableProps {
  rowCount: number;
  rowGetter: $TSFixMeFunction;
}

interface BaseTableCalculatedPropsWithContext extends BaseTableCalculatedProps {
  trackEvent: TrackEventType;
}

interface BaseTableState {
  activeColumns: string[];
  columns: ColumnProps[];
  columnWidthPercentages: Record<string, number>;
  columnCurrentlyDragged: $TSFixMeUnknown;
  mouseOverDraggableAreaForColumn: $TSFixMeUnknown;
}

class BaseTableCC extends React.Component<
  BaseTableCalculatedPropsWithContext,
  BaseTableState
> {
  // This class is a wrapper class to React Virtualized Table.
  // Sets some default values and style to guarantee consistency of
  // tables accross the site.
  // TODO: - limitations -
  // - needs dynamic row height (dynamic required use of CellMeasurer)

  constructor(props: BaseTableCalculatedPropsWithContext) {
    super(props);

    this.state = {
      // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2322
      activeColumns: this.props.initialActiveColumns,
      columns: BaseTableCC.setColumnDefaults(
        // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2345
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
  static getDerivedStateFromProps(props: BaseTableCalculatedProps, state) {
    if (props.columns !== state.prevPropsColumns) {
      return {
        activeColumns: props.initialActiveColumns,
        columns: BaseTableCC.setColumnDefaults(
          // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2345
          props.columns,
          props.defaultColumnWidth,
        ),
        prevPropsColumns: props.columns,
      };
    }
    return null;
  }

  // Add defaults to the columns.
  static setColumnDefaults(columns: ColumnProps[], defaultColumnWidth: number) {
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
          <ColumnHeaderTooltip
            trigger={
              <span className={cx(cs.label, headerLabelClassName)}>
                {label}
              </span>
            }
            content={label}
          />
        )}
      </div>
    );
  };

  _sortableHeaderRenderer = ({
    columnData,
    dataKey,
    label,
    sortBy,
    sortDirection,
  }) => {
    const { headerLabelClassName } = this.props;
    return (
      <div
        data-testid={`${kebabCase(label)}-column-header`}
        className={cx(cs.sortableHeader, sortBy === dataKey && cs.active)}
      >
        {columnData ? (
          <ColumnHeaderTooltip
            trigger={
              <span
                data-testid={`${kebabCase(label)}-column-header`}
                className={cx(cs.label, headerLabelClassName)}
              >
                {label}
              </span>
            }
            title={label}
            content={columnData.tooltip}
            link={columnData.link}
          />
        ) : (
          <ColumnHeaderTooltip
            trigger={
              <span className={cx(cs.label, headerLabelClassName)}>
                {label}
              </span>
            }
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

    // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2769
    const value = difference(activeColumns, protectedColumns);

    return (
      <BasicPopup
        trigger={
          <MultipleDropdown
            data-testid="plus-circle"
            direction="left"
            upward={false}
            hideArrow
            hideCounter
            rounded
            search
            checkedOnTop
            menuLabel="Select Columns"
            onChange={this.handleColumnChange}
            options={options}
            trigger={
              <Icon
                sdsIcon="plusCircle"
                sdsSize="s"
                sdsType="button"
                className={cs.plusIcon}
              />
            }
            // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2740
            value={value}
          />
        }
        content="Add or Remove Columns"
      />
    );
  };

  renderSelectableCell = ({ cellData }: TableCellProps): React.ReactNode => {
    const {
      selected,
      onSelectRow,
      selectableCellClassName,
      selectableCellRenderer,
    } = this.props;
    if (selectableCellRenderer) {
      return selectableCellRenderer({
        cellData,
        selected,
        onSelectRow,
        selectableCellClassName,
      });
    }

    const disabled = cellData === null || cellData === undefined;
    return (
      <Checkbox
        className={selectableCellClassName}
        // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2532
        checked={selected.has(cellData)}
        onChange={onSelectRow}
        value={disabled ? -1 : cellData}
        disabled={disabled}
        testId="row-select-checkbox"
      />
    );
  };

  renderSelectableHeader = () => {
    const { selectAllChecked, onSelectAllRows } = this.props;
    return (
      <Checkbox
        checked={selectAllChecked}
        // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2722
        onChange={(_value, checked) => onSelectAllRows(checked)}
        value={"all"}
      />
    );
  };

  render() {
    const {
      cellClassName,
      defaultCellRenderer,
      defaultHeaderHeight,
      defaultRowHeight,
      defaultSelectColumnWidth,
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
      selectRowDataGetter,
      sortable,
      sortBy,
      sortDirection,
      ...extraTableProps
    } = this.props;
    const { activeColumns, columns, columnWidthPercentages } = this.state;

    const columnOrder = activeColumns || map("dataKey", columns);

    return (
      <div
        className={cs.tableContainer}
        style={{ flexBasis: defaultHeaderHeight }}
      >
        <AutoSizer>
          {({ width, height }) => (
            // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2769
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
              sort={sortable ? onSort : null}
              sortBy={sortable ? sortBy : ""}
              sortDirection={sortable ? sortDirection : "DESC"}
              width={width}
              onRowClick={onRowClick}
              {...extraTableProps}
            >
              {selectableKey && (
                <Column
                  className={selectableColumnClassName}
                  dataKey={selectableKey}
                  headerRenderer={this.renderSelectableHeader}
                  cellDataGetter={selectRowDataGetter}
                  cellRenderer={this.renderSelectableCell}
                  disableSort={true}
                  // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2769
                  width={defaultSelectColumnWidth}
                />
              )}
              {columnOrder.map(dataKey => {
                const columnProps = find({ dataKey }, columns);
                if (!columnProps) {
                  return null;
                }

                const isSortableColumn = sortable && !columnProps.disableSort;

                const {
                  cellRenderer,
                  className,
                  // The px width value is destuctured here because we don't want it to override
                  // the width dervived from the percentage of the column * total width of the table.
                  // The column percentages are critical to the functionality of draggable columns.
                  width: pxWidth,
                  ...extraProps
                } = columnProps;

                let headerRenderer;
                if (isSortableColumn) {
                  headerRenderer = this._sortableHeaderRenderer;
                } else {
                  headerRenderer = this.basicHeaderRenderer;
                }

                return (
                  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                  // @ts-ignore (TODO - remove this - TS would like pxWidth to be a number but it could be undefined)
                  <Column
                    className={cx(cs.cell, cellClassName, className)}
                    columnData={columnProps.columnData}
                    key={dataKey}
                    // If the width percentage has not been calculated yet, use the default column width
                    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                    // @ts-ignore (TODO - remove this - TS would like pxWidth to be a number but it could be undefined)
                    width={
                      columnWidthPercentages[dataKey]
                        ? columnWidthPercentages[dataKey] * width
                        : pxWidth
                    }
                    headerRenderer={headerRenderer}
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

// @ts-expect-error ts-migrate(2339) FIXME: Property 'defaultProps' does not exist on type 'ty... Remove this comment to see the full error message
BaseTableCC.defaultProps = {
  defaultColumnWidth: 60,
  defaultHeaderHeight: 50,
  defaultRowHeight: 30,
  defaultSelectColumnWidth: 30,
  selected: new Set(),
  draggableColumns: false,
};

// Using a function component wrapper provides a semi-hacky way to
// access useContext from multiple providers without the class component to function component
// conversion.
const BaseTable = (props: BaseTableCalculatedProps) => {
  const trackEvent = useTrackEvent();

  return <BaseTableCC {...props} trackEvent={trackEvent} />;
};

export default BaseTable;
