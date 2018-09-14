import PropTypes from "prop-types";
import React from "react";
import Checkbox from "../../ui/controls/Checkbox";

class DataTable extends React.Component {
  // Table should be able to get data through:
  // - passed JSON object (To Be Implemented)
  // - async fetcher function
  constructor(props) {
    super(props);

    this.originalData = this.prepareData(this.props.data);

    this.state = {
      filter: "",
      selectedRows: new Set(this.props.selectedRows || [])
    };

    this.handleCheckBoxChange = this.handleCheckBoxChange.bind(this);
  }

  static getDerivedStateFromProps(props, state) {
    console.log(
      "DataTable::getDerivedStateFromProps - raw filter",
      props.filter
    );
    let newFilter = DataTable.prepareFilter(props.filter);
    console.log(
      "DataTable::getDerivedStateFromProps - processed filter",
      newFilter,
      state.filter
    );
    if (newFilter !== state.filter) {
      return {
        filter: newFilter
      };
    }
    return null;
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
    console.log("DataTable::filterData", data, this.state.filter);
    if (this.state.filter) {
      const filters = this.state.filter.split(/ +/);
      console.log("DataTable::filter", filters);
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

  prepareData() {
    let data = this.props.data.slice();
    for (let i = 0; i < data.length; i++) {
      data[i].__originalIndex = i;
    }
    return data;
  }

  handleCheckBoxChange(rowIndex, checked) {
    console.log("DataTable::handleCheckBoxChange", rowIndex, checked);
    if (checked === undefined) {
      console.log("DataTable::handleCheckBoxChange - no action!");
      return;
    }

    let stateUpdate = {};
    if (rowIndex < 0) {
      if (checked) {
        let allRows = new Set();
        for (let i = 0; i < this.state.data.length; i++) {
          allRows.add(this.state.data[i].__originalIndex);
        }
        stateUpdate = { selectedRows: allRows };
      } else {
        stateUpdate = { selectedRows: new Set() };
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
    console.log("DataTable::render - original", this.originalData);
    const filteredData = this.filterData(this.originalData);
    console.log("DataTable::render - filtered", filteredData);
    const allChecked = filteredData.every(row =>
      this.state.selectedRows.has(row.__originalIndex)
    );

    console.log("DataTable::render - allChecked", allChecked);

    console.log(
      "DataTable::render - selectedRows type",
      typeof this.state.selectedRows,
      this.state.selectedRows.has(0)
    );
    console.log(
      "DataTable::render - all checkbox",
      filteredData.length,
      filteredData.size === filteredData.length,
      filteredData.length
    );
    return (
      <table className="idseq-ui data-table">
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
              <th className={`data-table__header column-${column}`} key={idx}>
                {this.props.headers[column]}
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

// sub-components?
// TableHeader
// TableBody
// L TableRow
// TableFooter

DataTable.propTypes = {
  columns: PropTypes.array,
  data: PropTypes.array,
  headers: PropTypes.object
};

export default DataTable;
