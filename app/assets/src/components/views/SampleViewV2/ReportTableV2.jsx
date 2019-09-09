import React from "react";
import PropTypes from "prop-types";
import { Table } from "~/components/visualizations/table";

class ReportTableV2 extends React.Component {
  constructor(props) {
    super(props);

    this.columns = [
      {
        dataKey: "taxName",
        flexGrow: 1,
        widht: 400,
      },
      {
        dataKey: "r",
        flexGrow: 1,
        widht: 60,
      },
      {
        dataKey: "aggScore",
        flexGrow: 1,
        widht: 60,
      },
    ];
  }

  render() {
    const { data } = this.props;
    return <Table columns={this.columns} data={data} />;
  }
}

ReportTableV2.defaultProps = {
  data: [],
};

ReportTableV2.propTypes = {
  data: PropTypes.array,
};

export default ReportTableV2;
