import { ColumnDef } from "@tanstack/react-table";
import React from "react";
import { SortableHeader } from "~/components/ui/Table/components/SortableHeader";
import { generateWidthStyles } from "~/components/ui/Table/tableUtils";
import { AmrResult } from "../types";
import { getDefaultCell } from "./components/DefaultCell";

export const geneColumn: ColumnDef<AmrResult, any> = {
  id: "gene",
  accessorKey: "gene",
  size: 120,
  maxSize: 120,
  header: function geneHeader({ header, column }) {
    return (
      <SortableHeader header={header} style={generateWidthStyles(column)}>
        Gene
      </SortableHeader>
    );
  },
  // TODO: https://app.shortcut.com/idseq/story/230069/amr-08-show-gene-information-from-card
  // with the above, we will need to change this component to a new one which
  // contains a button to open the gene info panel. Define the component inline here.
  cell: getDefaultCell(),
};
