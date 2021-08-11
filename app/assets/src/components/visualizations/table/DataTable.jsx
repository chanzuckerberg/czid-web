import cx from "classnames";
import { get, set, isObject } from "lodash/fp";
import PropTypes from "prop-types";
import React from "react";
import ColumnHeaderTooltip from "~/components/ui/containers/ColumnHeaderTooltip";
import Checkbox from "../../ui/controls/Checkbox";
import cs from "./data_table.scss";
class DataTable extends React.Component {
  // TODO: async get data function
  constructor(props) {
    super(props);

    this.state = {
      filter: "",
      selectedRows: new Set(this.props.selectedRows || []),
      originalData: this.props.data,
      indexedData: DataTable.indexData(this.props.data),
    };

    this.handleCheckBoxChange = this.handleCheckBoxChange.bind(this);
  }

  static getDerivedStateFromProps(props, state) {
    let newFilter = DataTable.prepareFilter(props.filter);
    let newState = {};
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

  static prepareFilter(filter) {
    if (filter === undefined || filter === null) {
      return "";
    } else {
      return filter
        .toString()
        .trim()
        .toLowerCase();
    }
  }

  filterData(data) {
    if (this.state.filter) {
      const filters = this.state.filter.split(/ +/);
      return data.filter(row =>
        filters.every(filter => this.filterRow(row, filter))
      );
    }
    return data;
  }

  filterRow(row, filter) {
    return Object.keys(row).some(column => {
      if (!column.startsWith("__")) {
        let value =
          row[column] !== undefined &&
          row[column] !== null &&
          row[column].toString().toLowerCase();
        if (value && value.indexOf(filter) !== -1) {
          return true;
        }
      }
    });
  }

  static indexData(originalData) {
    return originalData.map((val, index) => set("__originalIndex", index, val));
  }

  handleCheckBoxChange(rowIndex, checked) {
    if (checked === undefined) {
      return;
    }

    let stateUpdate = {};
    if (rowIndex < 0) {
      let allRows = this.state.selectedRows || new Set();
      let filteredData = this.filterData(this.state.indexedData);
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
        stateUpdate = prevState => {
          prevState.selectedRows.add(rowIndex);
          return { selectedRows: prevState.selectedRows };
        };
      } else {
        stateUpdate = prevState => {
          prevState.selectedRows.delete(rowIndex);
          return { selectedRows: prevState.selectedRows };
        };
      }
    }

    this.setState(stateUpdate, () =>
      this.props.onSelectedRowsChanged(this.state.selectedRows)
    );
  }

  getCellStyle = column => {
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
      filteredData.every(row =>
        this.state.selectedRows.has(row.__originalIndex)
      );

    return (
      <table
        className={cx(
          "idseq-ui data-table",
          this.props.striped && "striped",
          this.props.className,
          this.props.onSelectedRowsChanged && "selectable"
        )}
      >
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
            {this.props.columns.map((column, idx) => (
              <th
                className={`data-table__header column-${column}`}
                key={idx}
                style={this.getCellStyle(column)}
              >
                {this.props.headers ? this.props.headers[column] : column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {filteredData.map(row => {
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

            const columns = this.props.columns.map((column, colIdx) => (
              <td
                className={cx(
                  `data-table__data column-${column}`,
                  shouldDisable && cs.disabled
                )}
                style={this.getCellStyle(column)}
                key={colIdx}
              >
                {/* If we want to display an object (e.g. location object), provide a 'name' field */}
                {isObject(row[column]) && row[column].name !== undefined
                  ? row[column].name
                  : row[column]}
              </td>
            ));

            return (
              <>
                {shouldDisable ? (
                  <ColumnHeaderTooltip
                    trigger={
                      <tr
                        key={row.__originalIndex}
                        className={shouldDisable && cs.disabled}
                      >
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
                    className={shouldDisable && cs.disabled}
                  >
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

DataTable.propTypes = {
  className: PropTypes.string,
  columns: PropTypes.array,
  data: PropTypes.array,
  filter: PropTypes.string,
  headers: PropTypes.object,
  onSelectedRowsChanged: PropTypes.func,
  selectedRows: PropTypes.oneOfType([
    PropTypes.arrayOf(PropTypes.number),
    // allow Set = TODO: replace by custom function
    PropTypes.object,
  ]),
  striped: PropTypes.bool,
  // TODO(mark): Make column width sizing more robust.
  columnWidth: PropTypes.number,
  getColumnWidth: PropTypes.func,
};

DataTable.defaultProps = {
  striped: true,
};

export default DataTable;
