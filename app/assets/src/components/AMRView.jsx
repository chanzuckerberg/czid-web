import React from "react";
import ReactTable from "react-table";
import "react-table/react-table.css";
import _ from "lodash";

const columns = [
  {
    Header: "Antibiotic Class",
    accessor: "drug_family"
  },
  {
    Header: "Gene",
    accessor: "gene",
    aggregate: vals => _.size(vals)
  },
  {
    Header: "Gene Family",
    accessor: "gene_family",
    aggregate: vals => _.size(vals)
  },
  {
    Header: "Coverage",
    accessor: "coverage",
    aggregate: vals => _.sum(vals),
    filterMethod: (filter, row) => row[filter.id] >= filter.value
  },
  {
    Header: "Depth",
    accessor: "depth",
    aggregate: vals => _.sum(vals),
    filterMethod: (filter, row) => row[filter.id] >= filter.value
  }
];

class AMRView extends React.Component {
  constructor(props) {
    super(props);
    this.state = { data: props.amr };
    for (var i = 0; i < Object.keys(this.state.data).length; i++) {
      var key = Object.keys(this.state.data)[i];
      this.state.data[key].gene_family = this.state.data[key].gene.slice(0, 5); // first four characters of gene family
    }
  }
  render() {
    const { data } = this.state;
    return (
      <div>
        <ReactTable
          filterable
          data={data}
          columns={columns}
          defaultPageSize={5}
          pivotBy={["drug_family", "gene_family"]}
          defaultSorted={[
            {
              id: "coverage",
              desc: true
            }
          ]}
          className="-striped -highlight"
        />
        <br />
      </div>
    );
  }
}
export default AMRView;
