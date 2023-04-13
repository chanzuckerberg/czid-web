import { ColumnDef } from "@tanstack/react-table";
import React from "react";
import { SortableHeader } from "~/components/ui/Table/components/SortableHeader";
import { generateWidthStyles } from "~/components/ui/Table/tableUtils";
import { AmrResult } from "../types";
import { getDefaultCell } from "./components/DefaultCell";

export const geneFamilyColumn: ColumnDef<AmrResult, any> = {
  id: "gene-family",
  accessorKey: "geneFamily",
  size: 200,
  maxSize: 200,
  header: function geneFamilyHeader({ header, column }) {
    return (
      <SortableHeader header={header} style={generateWidthStyles(column)}>
        Gene Family
      </SortableHeader>
    );
  },
  cell: getDefaultCell(),
};
