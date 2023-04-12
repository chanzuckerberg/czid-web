import { ColumnDef } from "@tanstack/react-table";
import React from "react";
import { SortableHeader } from "~/components/ui/Table/components/SortableHeader";
import { generateWidthStyles } from "~/components/ui/Table/tableUtils";
import { AmrResult } from "../types";
import { getDefaultCell } from "./components/DefaultCell";

export const modelColumn: ColumnDef<AmrResult, any> = {
  id: "model",
  accessorKey: "model",
  size: 200,
  maxSize: 200,
  header: function modelHeader({ header, column }) {
    return (
      <SortableHeader header={header} style={generateWidthStyles(column)}>
        Model
      </SortableHeader>
    );
  },
  cell: getDefaultCell(),
};
