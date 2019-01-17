import PropTypes from "prop-types";
import React from "react";
import cx from "classnames";
import { set } from "lodash/fp";
import Checkbox from "../../ui/controls/Checkbox";

class DataTable extends React.Component {
  // TODO: async get data function
  constructor(props) {
    super(props);

    this.state = {
      filter: "",
      selectedRows: new Set(this.props.selectedRows || []),
      originalData: this.props.data,
      indexedData: DataTable.indexData(this.props.data)
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
    for (let column in row) {
      if (row.hasOwnProperty(column) && !column.startsWith("__")) {
        let value =
          row[column] !== undefined &&
          row[column] !== null &&
          row[column].toString().toLowerCase();
        if (value && value.indexOf(filter) !== -1) {
          return true;
        }
      }
    }
    return false;
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
        if (checked) {
          allRows.add(filteredData[i].__originalIndex);
        } else {
          allRows.delete(filteredData[i].__originalIndex);
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

  render() {
    const filteredData = this.filterData(this.state.indexedData);
    const allChecked =
      filteredData.length > 0 &&
      filteredData.every(row =>
        this.state.selectedRows.has(row.__originalIndex)
      );

    const cellStyle = this.props.columnWidth
      ? { width: this.props.columnWidth }
      : {};

    return (
      <table
        className={cx(
          "idseq-ui data-table",
          this.props.striped && "striped",
          this.props.className
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
                style={cellStyle}
              >
                {this.props.headers ? this.props.headers[column] : column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {filteredData.map(row => (
            <tr key={row.__originalIndex}>
              {this.props.onSelectedRowsChanged && (
                <td className="data-table__data column-reserved-selectable">
                  <Checkbox
                    checked={this.state.selectedRows.has(row.__originalIndex)}
                    onChange={this.handleCheckBoxChange}
                    value={row.__originalIndex}
                  />
                </td>
              )}
              {this.props.columns.map((column, colIdx) => (
                <td
                  className={`data-table__data column-${column}`}
                  style={cellStyle}
                  key={colIdx}
                >
                  {row[column]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    );
  }
}

DataTable.propTypes = {
  className: PropTypes.string,
  columns: PropTypes.array,
  data: PropTypes.array,
  headers: PropTypes.object,
  onSelectedRowsChanged: PropTypes.func,
  selectedRows: PropTypes.oneOfType([
    PropTypes.arrayOf(PropTypes.number),
    // allow Set = TODO: replace by custom function
    PropTypes.object
  ]),
  striped: PropTypes.bool,
  // TODO(mark): Make column width sizing more robust.
  columnWidth: PropTypes.number
};

DataTable.defaultProps = {
  striped: true
};

export default DataTable;
