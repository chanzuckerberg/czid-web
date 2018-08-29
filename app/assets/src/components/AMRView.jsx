import React from "react";
import ReactTable from "react-table";
import "react-table/react-table.css";
import _ from "lodash";

const columns = [
  {
    Header: "Antibiotic Class",
    accessor: "drug_family",
    filterable: false
  },
  {
    Header: "Gene",
    accessor: "gene",
    aggregate: vals => _.size(vals),
    style: {
      textAlign: "center"
    },
    filterable: false
  },
  {
    Header: "Gene Family",
    accessor: "gene_family",
    aggregate: vals => _.size(vals),
    style: {
      textAlign: "center"
    },
    filterable: false
  },
  {
    Header: "Coverage",
    accessor: "coverage",
    style: {
      textAlign: "center"
    },
    aggregate: vals => _.round(_.mean(vals)),
    filterMethod: (filter, row) => row[filter.id] >= filter.value,
    Cell: props => parseFloat(props.value).toFixed(1)
  },
  {
    Header: "Depth",
    accessor: "depth",
    aggregate: vals => _.round(_.sum(vals)),
    style: {
      textAlign: "center"
    },
    filterMethod: (filter, row) => row[filter.id] >= filter.value,
    Cell: props => parseFloat(props.value).toFixed(1)
  }
];

class AMRView extends React.Component {
  constructor(props) {
    super(props);
    this.data = props.amr ? props.amr : (this.data = []);
    if (this.data) {
      // TODO: Talk with Chaz to determine how to improve gene family identification further.
      for (var i = 0; i < Object.keys(this.data).length; i++) {
        var key = Object.keys(this.data)[i];
        this.data[key].gene_family = this.data[key].gene.slice(0, 5); // first four characters of gene family
      }
    }
  }
  render() {
    return (
      <div>
        <ReactTable
          filterable
          defaultFilterMethod={(filter, row, column) => {
            const id = filter.pivotId || filter.id;
            return row[id] !== undefined
              ? String(row[id])
                  .toLowerCase()
                  .includes(filter.value.toLowerCase())
              : true;
          }}
          data={this.data}
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
