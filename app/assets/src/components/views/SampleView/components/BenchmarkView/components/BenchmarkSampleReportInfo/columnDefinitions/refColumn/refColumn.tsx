import { ColumnDef } from "@tanstack/react-table";
import React from "react";
import { SortableHeader } from "~/components/ui/Table/components/SortableHeader";
import { generateWidthStyles } from "~/components/ui/Table/tableUtils";
import { getDefaultCell } from "~/components/views/SampleView/components/AmrView/components/AmrSampleReport/columnDefinitions/components/DefaultCell";
import { BenchmarkWorkflowRunAdditionalInfoEntry } from "~/interface/sampleView";

export const refColumn: ColumnDef<
  BenchmarkWorkflowRunAdditionalInfoEntry,
  any
> = {
  id: "isRef",
  accessorKey: "isRef",
  accessorFn: function readCoverageBreadthAccessor(row) {
    return row?.isRef ? "Yes" : "-";
  },
  size: 200,
  minSize: 200,
  header: function refColumnHeader({ header, column }) {
    return (
      <SortableHeader
        header={header}
        style={generateWidthStyles(column)}
        isSortDefaultDesc={false}
      >
        REF
      </SortableHeader>
    );
  },
  cell: getDefaultCell(),
};
