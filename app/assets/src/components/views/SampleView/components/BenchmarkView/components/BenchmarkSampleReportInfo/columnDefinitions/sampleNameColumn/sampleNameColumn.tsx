import { ColumnDef } from "@tanstack/react-table";
import React from "react";
import { SortableHeader } from "~/components/ui/Table/components/SortableHeader";
import { generateWidthStyles } from "~/components/ui/Table/tableUtils";
import { getDefaultCell } from "~/components/views/SampleView/components/AmrView/components/AmrSampleReport/columnDefinitions/components/DefaultCell";
import { BenchmarkWorkflowRunAdditionalInfoEntry } from "~/interface/sampleView";

export const sampleNameColumn: ColumnDef<
  BenchmarkWorkflowRunAdditionalInfoEntry,
  any
> = {
  id: "sampleName",
  accessorKey: "sampleName",
  size: 500,
  minSize: 500,
  header: function sampleNameHeader({ header, column }) {
    return (
      <SortableHeader
        header={header}
        style={generateWidthStyles(column)}
        isSortDefaultDesc={false}
      >
        Sample Name
      </SortableHeader>
    );
  },
  cell: getDefaultCell(),
};
