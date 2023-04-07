import { ColumnDef } from "@tanstack/react-table";
import React from "react";
import { SortableHeader } from "~/components/ui/Table/components/SortableHeader";
import { generateWidthStyles } from "~/components/ui/Table/tableUtils";
import { AmrResult } from "../types";
import { DefaultCell } from "./components/DefaultCell";

export const cutoffColumn: ColumnDef<AmrResult, any> = {
  id: "cutoff",
  accessorKey: "cutoff",
  size: 100,
  header: function cutoffHeader({ header, column }) {
    return (
      <SortableHeader header={header} style={generateWidthStyles(column)}>
        Cutoff
      </SortableHeader>
    );
  },
  cell: DefaultCell,
};
