import React from "react";
import PropTypes from "prop-types";
import { Table } from "~/components/visualizations/table";

class ReportTableV2 extends React.Component {
  constructor(props) {
    super(props);

    this.columns = [
      {
        dataKey: "name",
        flexGrow: 1,
        widht: 400,
      },
      {
        dataKey: "agg_score",
        flexGrow: 1,
        widht: 60,
      },
      {
        dataKey: "taxLevel",
        flexGrow: 1,
        widht: 60,
      },
      {
        cellDataGetter: ({ rowData }) => {
          return [
            (rowData.nt || {}).z_score || 0,
            (rowData.nr || {}).z_score || 0,
          ];
        },
        dataKey: "z_score",
        flexGrow: 1,
        widht: 60,
      },
      {
        cellDataGetter: ({ rowData }) => {
          return [(rowData.nt || {}).rpm || 0, (rowData.nr || {}).rpm || 0];
        },
        dataKey: "rpm",
        flexGrow: 1,
        widht: 60,
      },
      {
        cellDataGetter: ({ rowData }) => {
          return [(rowData.nt || {}).count || 0, (rowData.nr || {}).count || 0];
        },
        dataKey: "r",
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
