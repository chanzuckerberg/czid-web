import React from "react";

class ReportTable extends React.Component {
  constructor(props) {
    this.columns = [
      {
        dataKey: "taxName",
        flexGrow: 1,
        widht: 400
      },
      {
        dataKey: "r",
        flexGrow: 1,
        widht: 60
      },
      {
        dataKey: "aggScore",
        flexGrow: 1,
        widht: 60
      },
    ];
  }

  render() {
    return (
      <Table
        columns={this.columns}
        data={data}
        />
    );
  }
}

ReportTable.defaultProps = {
  data: []
}

ReportTable.propTypes = {
  data: propTypes.array
}

export default ReportTable;