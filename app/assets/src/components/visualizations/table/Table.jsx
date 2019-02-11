import React from "react";
import BaseTable from "./BaseTable";

class Table extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    return <BaseTable {...this.props} />;
  }
}

export default Table;
