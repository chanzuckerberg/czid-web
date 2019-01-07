import React from "react";
import PropTypes from "prop-types";
import cs from "./basic_table.scss";

class BasicTable extends React.Component {
  render() {
    const { headers } = this.props;

    return (
      <table className={cs.basicTable}>
        <thead>
          <tr>
            {headers.map((name, idx) => (
              <th className={cs.header} key={idx}>
                {name}
              </th>
            ))}
          </tr>
        </thead>
      </table>
    );
  }
}

BasicTable.propTypes = {
  headers: PropTypes.array
};

export default BasicTable;
