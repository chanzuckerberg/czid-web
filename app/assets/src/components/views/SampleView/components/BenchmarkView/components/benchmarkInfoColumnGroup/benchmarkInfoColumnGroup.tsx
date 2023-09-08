import { ColumnDef } from "@tanstack/react-table";
import React from "react";
import { generateHeaderWidthStyles } from "~/components/ui/Table/tableUtils";
import { BenchmarkWorkflowRunAdditionalInfoEntry } from "~/interface/sampleView";
import cs from "./benchmark_info_column_group.scss";

export const benchmarkInfoColumnGroup = (
  columns: ColumnDef<BenchmarkWorkflowRunAdditionalInfoEntry, any>[],
  nRows: number,
) => {
  return {
    id: "benchmarkInfoColumnGroup",
    colspan: columns.length,
    columns,
    header: function benchmarkInfoColumnGroup({ header }) {
      return (
        <th
          key={`header-${header.id}`}
          className={cs.rowCountHeader}
          colSpan={header.colSpan}
          style={generateHeaderWidthStyles(header)}
        >
          {!!nRows && <span className={cs.rowCount}>{`${nRows} Rows`}</span>}
        </th>
      );
    },
  };
};
