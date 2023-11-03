import cx from "classnames";
import React from "react";
import { Table } from "~/components/visualizations/table";
import ColumnHeaderTooltip from "~ui/containers/ColumnHeaderTooltip";
import cs from "./blast_contigs_table.scss";
import {
  BLAST_CONTIG_HEADER_ROW_WIDTH,
  BLAST_CONTIG_ROW_WIDTH,
} from "./constants";

interface BlastContigsTableProps {
  contigs?: unknown[];
  onContigSelection?: $TSFixMeFunction;
  onAllContigsSelected?: $TSFixMeFunction;
  selectedContigs?: Set<$TSFixMe>;
}

const BlastContigsTable = ({
  contigs,
  onContigSelection,
  onAllContigsSelected,
  selectedContigs,
}: BlastContigsTableProps) => {
  const contigNameCellRenderer = ({ contigName }) => (
    <ColumnHeaderTooltip
      trigger={<div className={cx(cs.cell, cs.contigName)}>{contigName}</div>}
      content={contigName}
      position="bottom center"
      inverted
    />
  );

  const CONTIG_COLUMNS = [
    {
      dataKey: "contig_name",
      width: 300,
      label: "Name",
      cellRenderer: ({ cellData }) =>
        contigNameCellRenderer({ contigName: cellData }),
      headerClassName: cx(cs.header, cs.contigNameHeader),
    },
    {
      dataKey: "num_reads",
      width: 140,
      label: "Reads",
      className: cx(cs.cell, cs.numReads),
      headerClassName: cs.header,
    },
    {
      dataKey: "contig_length",
      width: 125,
      label: "Length",
      className: cx(cs.cell, cs.contigLength),
      headerClassName: cs.header,
    },
  ];

  return (
    <Table
      data={contigs}
      defaultRowHeight={BLAST_CONTIG_ROW_WIDTH}
      headerHeight={BLAST_CONTIG_HEADER_ROW_WIDTH}
      columns={CONTIG_COLUMNS}
      onSelectRow={onContigSelection}
      onRowClick={({ rowData }) =>
        // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2722
        onContigSelection(
          rowData.contig_id,
          // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2532
          !selectedContigs.has(rowData.contig_id),
        )
      }
      onSelectAllRows={onAllContigsSelected}
      rowClassName={cs.tableDataRow}
      selected={selectedContigs}
      selectableCellClassName={cs.selectableCell}
      selectableKey="contig_id"
      sortable={false}
    />
  );
};

export default BlastContigsTable;
