import { ColumnDef } from "@tanstack/react-table";
import React from "react";
import { SortableHeader } from "~/components/ui/Table/components/SortableHeader";
import { generateWidthStyles } from "~/components/ui/Table/tableUtils";
import { AmrResult } from "../types";
import { getDefaultCell } from "./components/DefaultCell";
import { MODEL_COLUMN_TOOLTIP_STRINGS } from "./constants";

export const modelColumn: ColumnDef<AmrResult, any> = {
  id: "model",
  accessorKey: "model",
  size: 110,
  minSize: 110,
  header: function modelHeader({ header, column }) {
    return (
      <SortableHeader
        header={header}
        style={generateWidthStyles(column)}
        tooltipStrings={MODEL_COLUMN_TOOLTIP_STRINGS}
      >
        Model
      </SortableHeader>
    );
  },
  cell: getDefaultCell(),
};
