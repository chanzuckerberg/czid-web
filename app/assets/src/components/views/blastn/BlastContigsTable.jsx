import cx from "classnames";
import PropTypes from "prop-types";
import React from "react";

import { Table } from "~/components/visualizations/table";
import cs from "./blast_contigs_table.scss";
import {
  BLAST_CONTIG_ROW_WIDTH,
  BLAST_CONTIG_HEADER_ROW_WIDTH,
} from "./constants";

const BlastContigsTable = ({
  contigs,
  onContigSelection,
  onAllContigsSelected,
  selectedContigs,
}) => {
  const CONTIG_COLUMNS = [
    {
      dataKey: "contig_name",
      width: 300,
      label: "Contig name",
      className: cx(cs.cell, cs.contigName),
      headerClassName: cx(cs.header, cs.contigNameHeader),
    },
    {
      dataKey: "num_reads",
      width: 140,
      label: "Number of reads",
      className: cx(cs.cell, cs.numReads),
      headerClassName: cs.header,
    },
    {
      dataKey: "contig_length",
      width: 125,
      label: "Contig length",
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
        onContigSelection(
          rowData.contig_id,
          !selectedContigs.has(rowData.contig_id)
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

BlastContigsTable.propTypes = {
  contigs: PropTypes.array,
  onContigSelection: PropTypes.func,
  onAllContigsSelected: PropTypes.func,
  selectedContigs: PropTypes.instanceOf(Set),
};

export default BlastContigsTable;
