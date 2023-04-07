import cx from "classnames";
import { get, isObject, set } from "lodash/fp";
import React from "react";
import ColumnHeaderTooltip from "~/components/ui/containers/ColumnHeaderTooltip";
import Checkbox from "../../ui/controls/Checkbox";
import cs from "./data_table.scss";

interface DataTableProps {
  className?: string;
  columns?: $TSFixMeUnknown[];
  data?: $TSFixMeUnknown[];
  filter?: string;
  headers?: object;
  onSelectedRowsChanged?: $TSFixMeFunction;
  selectedRows?: number[];
  striped?: boolean;
  // TODO(mark): Make column width sizing more robust.
  columnWidth?: number;
  getColumnWidth?: $TSFixMeFunction;
}

interface DataTableState {
  selectedRows?;
  filter?: string;
  originalData?: DataTableProps["data"];
  indexedData?;
}

class DataTable extends React.Component<DataTableProps, DataTableState> {
  // TODO: async get data function
  constructor(props: DataTableProps) {
    super(props);

    this.state = {
      filter: "",
      selectedRows: new Set(this.props.selectedRows || []),
      originalData: this.props.data,
      indexedData: DataTable.indexData(this.props.data),
    };

    this.handleCheckBoxChange = this.handleCheckBoxChange.bind(this);
  }

  static getDerivedStateFromProps(
    props: DataTableProps,
    state: DataTableState,
  ) {
    const newFilter = DataTable.prepareFilter(props.filter);
    const newState: DataTableState = {};
    if (newFilter !== state.filter) {
      newState.filter = newFilter;
    }
    if (props.data !== state.originalData) {
      // TODO: This can cause issues on data update because the selectedRow indices will change.
      newState.originalData = props.data;
      newState.indexedData = DataTable.indexData(props.data);
    }
    return newState;
  }

  static prepareFilter(filter: unknown) {
    if (filter === undefined || filter === null) {
      return "";
    } else {
      return filter.toString().trim().toLowerCase();
    }
  }

  filterData(data: $TSFixMe) {
    if (this.state.filter) {
      const filters = this.state.filter.split(/ +/);
      return data.filter((row: $TSFixMe) =>
        filters.every((filter: $TSFixMe) => this.filterRow(row, filter)),
      );
    }
    return data;
  }

  filterRow(row: $TSFixMe, filter: $TSFixMe) {
    return Object.keys(row).some(column => {
      if (!column.startsWith("__")) {
        const value =
          row[column] !== undefined &&
          row[column] !== null &&
          row[column].toString().toLowerCase();
        if (value && value.indexOf(filter) !== -1) {
          return true;
        }
      }
    });
  }

  static indexData(originalData: $TSFixMe) {
    return originalData.map((val: $TSFixMe, index: $TSFixMe) =>
      set("__originalIndex", index, val),
    );
  }

  handleCheckBoxChange(rowIndex: $TSFixMe, checked: $TSFixMe) {
    if (checked === undefined) {
      return;
    }

    let stateUpdate = {};
    if (rowIndex < 0) {
      const allRows = this.state.selectedRows || new Set();
      const filteredData = this.filterData(this.state.indexedData);
      for (let i = 0; i < filteredData.length; i++) {
        if (!get("shouldDisable", filteredData[i])) {
          if (checked) {
            allRows.add(filteredData[i].__originalIndex);
          } else {
            allRows.delete(filteredData[i].__originalIndex);
          }
        }
        stateUpdate = { selectedRows: allRows };
      }
    } else {
      if (checked) {
        stateUpdate = (prevState: $TSFixMe) => {
          prevState.selectedRows.add(rowIndex);
          return { selectedRows: prevState.selectedRows };
        };
      } else {
        stateUpdate = (prevState: $TSFixMe) => {
          prevState.selectedRows.delete(rowIndex);
          return { selectedRows: prevState.selectedRows };
        };
      }
    }

    this.setState(stateUpdate, () =>
      this.props.onSelectedRowsChanged(this.state.selectedRows),
    );
  }

  getCellStyle = (column: $TSFixMe) => {
    const { columnWidth, getColumnWidth } = this.props;

    const style = {};
    if (columnWidth) {
      style["width"] = columnWidth;
    } else if (getColumnWidth) {
      style["width"] = getColumnWidth(column);
    }

    return style;
  };

  render() {
    const filteredData = this.filterData(this.state.indexedData);
    const allChecked =
      filteredData.length > 0 &&
      filteredData.every((row: $TSFixMe) =>
        this.state.selectedRows.has(row.__originalIndex),
      );

    return (
      <table
        className={cx(
          "idseq-ui data-table",
          this.props.striped && "striped",
          this.props.className,
          this.props.onSelectedRowsChanged && "selectable",
        )}>
        <thead>
          <tr>
            {this.props.onSelectedRowsChanged && (
              <th className="data-table__header column-reserved-selectable">
                <Checkbox
                  checked={allChecked}
                  onChange={this.handleCheckBoxChange}
                  value={-1}
                />
              </th>
            )}
            {this.props.columns.map((column: string, idx) => (
              <th
                className={`data-table__header column-${column}`}
                key={idx}
                style={this.getCellStyle(column)}>
                {this.props.headers ? this.props.headers[column] : column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {filteredData.map((row: $TSFixMe) => {
            const shouldDisable = get("shouldDisable", row);
            const checkbox = (
              <Checkbox
                checked={
                  !shouldDisable &&
                  this.state.selectedRows.has(row.__originalIndex)
                }
                onChange={this.handleCheckBoxChange}
                value={row.__originalIndex}
              />
            );

            const columnTooltips = get("columnTooltips", row);
            const columns = this.props.columns.map((column: string, colIdx) => {
              const col = (
                <td
                  className={cx(
                    `data-table__data column-${column}`,
                    shouldDisable && cs.disabled,
                  )}
                  style={this.getCellStyle(column)}
                  key={colIdx}
                  data-testid={column.toLowerCase().replace(/ /g, "-")}>
                  {/* If we want to display an object (e.g. location object), provide a 'name' field */}
                  {isObject(row[column]) && row[column].name !== undefined
                    ? row[column].name
                    : row[column]}
                </td>
              );

              return columnTooltips && columnTooltips[column] ? (
                <ColumnHeaderTooltip
                  trigger={col}
                  content={get("content", columnTooltips[column])}
                  offset={get("offset", columnTooltips[column])}
                  position={get("position", columnTooltips[column])}
                />
              ) : (
                col
              );
            });

            return (
              <>
                {shouldDisable ? (
                  <ColumnHeaderTooltip
                    trigger={
                      <tr
                        key={row.__originalIndex}
                        className={shouldDisable && cs.disabled}>
                        {this.props.onSelectedRowsChanged && (
                          <td className="data-table__data column-reserved-selectable">
                            {React.cloneElement(checkbox, { disabled: true })}
                          </td>
                        )}
                        {columns}
                      </tr>
                    }
                    content={get(["tooltipInfo", "content"], row)}
                    position={get(["tooltipInfo", "position"], row)}
                  />
                ) : (
                  <tr
                    key={row.__originalIndex}
                    className={shouldDisable && cs.disabled}>
                    {this.props.onSelectedRowsChanged && (
                      <td className="data-table__data column-reserved-selectable">
                        {checkbox}
                      </td>
                    )}
                    {columns}
                  </tr>
                )}
              </>
            );
          })}
        </tbody>
      </table>
    );
  }
}

// @ts-expect-error ts-migrate(2339) FIXME: Property 'defaultProps' does not exist on type 'ty... Remove this comment to see the full error message
DataTable.defaultProps = {
  striped: true,
};

export default DataTable;
