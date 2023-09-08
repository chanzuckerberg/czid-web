import { ColumnDef } from "@tanstack/react-table";
import React from "react";
import { SortableHeader } from "~/components/ui/Table/components/SortableHeader";
import { generateWidthStyles } from "~/components/ui/Table/tableUtils";
import { getDefaultCell } from "~/components/views/SampleView/components/AmrView/components/AmrSampleReport/columnDefinitions/components/DefaultCell";
import { BenchmarkWorkflowRunAdditionalInfoEntry } from "~/interface/sampleView";

export const pipelineVersionColumn: ColumnDef<
  BenchmarkWorkflowRunAdditionalInfoEntry,
  any
> = {
  id: "pipelineVersion",
  accessorKey: "pipelineVersion",
  size: 200,
  minSize: 200,
  header: function pipelineVersionHeader({ header, column }) {
    return (
      <SortableHeader
        header={header}
        style={generateWidthStyles(column)}
        isSortDefaultDesc={false}
      >
        Pipeline Version
      </SortableHeader>
    );
  },
  cell: getDefaultCell(),
};
