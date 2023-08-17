import cx from "classnames";
import { get, map, pick } from "lodash/fp";
import React from "react";
import { Table } from "~/components/visualizations/table";
import { Entry } from "~/interface/samplesView";
import cs from "./benchmark_samples_table.scss";

interface BenchmarkSamplesTableProps {
  selectedObjects: Entry[];
}

const COLUMNS = [
  {
    dataKey: "name",
    width: 400,
    label: "Name",
    headerClassName: cx(cs.header, cs.sampleNameHeader),
    cellDataGetter: ({ dataKey, rowData }) => get(["sample", dataKey], rowData),
  },
  {
    dataKey: "pipelineVersion",
    width: 90,
    label: "Reads",
    className: cx(cs.cell),
    headerClassName: cs.header,
  },
  {
    dataKey: "pipelineNcbiIndex",
    width: 90,
    label: "NCBI Index",
    className: cx(cs.cell),
    headerClassName: cs.header,
  },
];
const ROW_HEIGHT = 38;
const HEADER_HEIGHT = 36;

export const BenchmarkSamplesTable = ({
  selectedObjects,
}: BenchmarkSamplesTableProps) => {
  const objectsToDisplay = map(
    object =>
      pick(["sample.name", "pipelineVersion", "pipelineNcbiIndex"], object),
    selectedObjects,
  );

  return (
    <div
      className={cs.table}
      style={{
        // Style must be explicitly passed in via inline styling here due to the Table component using Autosizer
        // Since Autosizer is baked in to the Table implementation, it requires a fixed parent height for virtualization to work
        // otherwise, the height of the table will be displayed as 0.
        height: ROW_HEIGHT * objectsToDisplay.length + HEADER_HEIGHT,
      }}
    >
      <Table
        data={objectsToDisplay}
        defaultRowHeight={ROW_HEIGHT}
        headerHeight={HEADER_HEIGHT}
        columns={COLUMNS}
        rowClassName={cs.tableDataRow}
        selectableCellClassName={cs.selectableCell}
        sortable={false}
      />
    </div>
  );
};
