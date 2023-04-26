import { ColumnDef } from "@tanstack/react-table";
import React from "react";
import { SortableHeader } from "~/components/ui/Table/components/SortableHeader";
import { generateWidthStyles } from "~/components/ui/Table/tableUtils";
import { AmrResult } from "../types";
import { getDefaultCell } from "./components/DefaultCell";
import { DRUG_CLASS_COLUMN_TOOLTIP_STRINGS } from "./constants";

export const drugClassColumn: ColumnDef<AmrResult, any> = {
  id: "drugClass",
  accessorKey: "drugClass",
  size: 200,
  maxSize: 200,
  header: function drugClassHeader({ header, column }) {
    return (
      <SortableHeader
        header={header}
        style={generateWidthStyles(column)}
        tooltipStrings={DRUG_CLASS_COLUMN_TOOLTIP_STRINGS}
      >
        Drug Class
      </SortableHeader>
    );
  },
  cell: getDefaultCell(),
};
