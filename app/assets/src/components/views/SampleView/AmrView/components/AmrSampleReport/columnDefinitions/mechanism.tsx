import { ColumnDef } from "@tanstack/react-table";
import React from "react";
import { SortableHeader } from "~/components/ui/Table/components/SortableHeader";
import { generateWidthStyles } from "~/components/ui/Table/tableUtils";
import { AmrResult } from "../types";
import { getDefaultCell } from "./components/DefaultCell";

export const mechanismColumn: ColumnDef<AmrResult, any> = {
  id: "mechanism",
  accessorKey: "mechanism",
  size: 120,
  maxSize: 200,
  header: function mechanismHeader({ header, column }) {
    return (
      <SortableHeader header={header} style={generateWidthStyles(column)}>
        Mechanism
      </SortableHeader>
    );
  },
  cell: getDefaultCell(),
};
