import { ColumnDef } from "@tanstack/react-table";
import React from "react";
import { SortableHeader } from "~/components/ui/Table/components/SortableHeader";
import { generateWidthStyles } from "~/components/ui/Table/tableUtils";
import { getDefaultCell } from "~/components/views/SampleView/components/AmrView/components/AmrSampleReport/columnDefinitions/components/DefaultCell";
import { BenchmarkWorkflowRunAdditionalInfoEntry } from "~/interface/sampleView";

export const pipelineIdColumn: ColumnDef<
  BenchmarkWorkflowRunAdditionalInfoEntry,
  any
> = {
  id: "pipelineId",
  accessorKey: "runId",
  size: 200,
  minSize: 200,
  header: function pipelineIdHeader({ header, column }) {
    return (
      <SortableHeader
        header={header}
        style={generateWidthStyles(column)}
        isSortDefaultDesc={false}
      >
        Pipeline ID
      </SortableHeader>
    );
  },
  cell: getDefaultCell(),
};
