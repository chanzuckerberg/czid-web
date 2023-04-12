import { ColumnDef } from "@tanstack/react-table";
import React from "react";
import { SortableHeader } from "~/components/ui/Table/components/SortableHeader";
import { generateWidthStyles } from "~/components/ui/Table/tableUtils";
import { AmrResult } from "../types";
import cs from "./column_definitions.scss";
import { RightAlignedCell } from "./components/RightAlignedCell";

export const contigsColumn: ColumnDef<AmrResult, any> = {
  id: "contigs",
  accessorKey: "contigs",
  size: 70,
  header: function contigsHeader({ header, column }) {
    return (
      <SortableHeader
        className={cs.rightAlignedHeader}
        header={header}
        style={generateWidthStyles(column)}
      >
        Contigs
      </SortableHeader>
    );
  },
  cell: RightAlignedCell,
};
