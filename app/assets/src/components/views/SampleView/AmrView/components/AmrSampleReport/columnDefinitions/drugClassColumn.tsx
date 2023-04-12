import { ColumnDef } from "@tanstack/react-table";
import React from "react";
import { SortableHeader } from "~/components/ui/Table/components/SortableHeader";
import { generateWidthStyles } from "~/components/ui/Table/tableUtils";
import { AmrResult } from "../types";
import { getDefaultCell } from "./components/DefaultCell";

export const drugClassColumn: ColumnDef<AmrResult, any> = {
  id: "drug-class",
  accessorKey: "drugClass",
  size: 200,
  maxSize: 200,
  header: function drugClassHeader({ header, column }) {
    return (
      <SortableHeader header={header} style={generateWidthStyles(column)}>
        Drug Class
      </SortableHeader>
    );
  },
  cell: getDefaultCell(),
};
