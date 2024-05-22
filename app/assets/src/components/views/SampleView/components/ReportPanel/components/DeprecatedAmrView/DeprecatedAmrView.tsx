import _ from "lodash";
import React from "react";
import ReactTable from "react-table";
import "react-table/react-table.css";
import cs from "./amr_view.scss";

const columns = [
  {
    Header: "Antibiotic Class",
    accessor: "drug_family",
    filterable: false,
  },
  {
    Header: "Gene",
    accessor: "gene",
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    aggregate: (_vals: $TSFixMe) => "",
    style: {
      textAlign: "center",
    },
    filterable: false,
  },
  {
    Header: "Coverage",
    accessor: "coverage",
    style: {
      textAlign: "center",
    },
    aggregate: (vals: $TSFixMe) => _.round(_.mean(vals)),
    filterMethod: (filter: $TSFixMe, row: $TSFixMe) =>
      row[filter.id] >= filter.value,
    Cell: (props: $TSFixMe) => parseFloat(props.value).toFixed(1),
  },
  {
    Header: "Depth",
    accessor: "depth",
    aggregate: (vals: $TSFixMe) => _.round(_.sum(vals)),
    style: {
      textAlign: "center",
    },
    filterMethod: (filter: $TSFixMe, row: $TSFixMe) =>
      row[filter.id] >= filter.value,
    Cell: (props: $TSFixMe) => parseFloat(props.value).toFixed(1),
  },
];

interface DeprecatedAmrViewProps {
  amr?: object;
}

export class DeprecatedAmrView extends React.Component<DeprecatedAmrViewProps> {
  data: $TSFixMe;
  constructor(props: DeprecatedAmrViewProps) {
    super(props);
    this.data = props.amr ? props.amr : (this.data = []);
    if (this.data) {
      // TODO: Talk with Chaz to determine how to improve gene family identification further.
      for (let i = 0; i < Object.keys(this.data).length; i++) {
        const key = Object.keys(this.data)[i];
        this.data[key].gene_family = this.data[key].gene.slice(0, 5); // first four characters of gene family
      }
    }
  }
  render() {
    return (
      <div className={cs.tableContainer}>
        <ReactTable
          filterable
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          defaultFilterMethod={(filter, row, _column) => {
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
          pivotBy={["drug_family"]}
          defaultSorted={[
            {
              id: "coverage",
              desc: true,
            },
          ]}
          className="-striped -highlight"
        />
        <br />
      </div>
    );
  }
}
