import PropTypes from "prop-types";
import React from "react";
import Checkbox from "../../ui/controls/Checkbox";

class DataTable extends React.Component {
  // Table should be able to get data through:
  // - passed JSON object (To Be Implemented)
  // - async fetcher function
  constructor(props) {
    super(props);

    this.state = {
      data: this.props.data,
      selectedRows: new Set()
    };
  }

  static getDerivedStateFromProps(props, state) {
    console.log("DataTable::getDerivedStateFromProps", props, state);
    if (props.data !== state.data) {
      return {
        data: props.data
      };
    }
    return null;
  }

  handleCheckBoxChange(index, checked) {
    console.log("DataTable::handleCheckBoxChange", index, checked);
    // this.setState({

    // })
    // if (index < 0) {
    //   this.props.onSelectedRowsChanged(this.state.data[index]);
    // } else {
    //   this.props.onSelectedRowsChanged(this.state.data);
    // }
  }

  render() {
    console.log("DataTable::getDerivedStateFromProps", this.props);
    return (
      <table className="idseq-ui data-table">
        <thead>
          <tr>
            {this.props.onSelectedRowsChanged && (
              <th className="data-table__header column-reserved-selectable">
                <Checkbox
                  checked={
                    this.state.selectedRows.length &&
                    this.state.selectedRows.size === this.state.data.length
                  }
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
          {this.state.data.map((row, row_idx) => (
            <tr key={row_idx}>
              {this.props.onSelectedRowsChanged && (
                <td className="data-table__data column-reserved-selectable">
                  <Checkbox
                    checked={this.state.selectedRows.has(row_idx)}
                    onChange={this.handleCheckBoxChange}
                    value={row_idx}
                  />
                </td>
              )}
              {this.props.columns.map((column, col_idx) => (
                <td
                  className={`data-table__data column-${column}`}
                  key={col_idx}
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
