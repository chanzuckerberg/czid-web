import PropTypes from "prop-types";
import React from "react";

class DataTable extends React.Component {
  // Table should be able to get data through:
  // - passed JSON object (To Be Implemented)
  // - async fetcher function
  constructor(props) {
    super(props);
  }

  render() {
    console.log("props", this.props);
    return (
      <table>
        <thead>
          <tr>
            {this.props.columns.map((column, idx) => (
              <th key={idx}>{this.props.headers[column]}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {this.props.data.map((row, row_idx) => (
            <tr key={row_idx}>
              {this.props.columns.map((column, col_idx) => (
                <td key={col_idx}>{row[column]}</td>
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
