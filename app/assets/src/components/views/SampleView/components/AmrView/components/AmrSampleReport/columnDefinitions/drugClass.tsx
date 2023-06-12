import { ColumnDef } from "@tanstack/react-table";
import React from "react";
import { SortableHeader } from "~/components/ui/Table/components/SortableHeader";
import { generateWidthStyles } from "~/components/ui/Table/tableUtils";
import { AmrResult } from "../types";
import { getDefaultCell } from "./components/DefaultCell";
import {
  getFormattedCompoundString,
  sortStringOrFallback,
} from "./components/valueFormatUtils";
import { DRUG_CLASS_COLUMN_TOOLTIP_STRINGS } from "./constants";

export const drugClassColumn: ColumnDef<AmrResult, any> = {
  id: "drugClass",
  accessorFn: function drugClassAccessor(row): string {
    return getFormattedCompoundString(row.drugClass);
  },
  sortingFn: sortStringOrFallback,
  size: 200,
  header: function drugClassHeader({ header, column }) {
    return (
      <SortableHeader
        header={header}
        style={generateWidthStyles(column)}
        tooltipStrings={DRUG_CLASS_COLUMN_TOOLTIP_STRINGS}
        isSortDefaultDesc={false}
      >
        Drug Class
      </SortableHeader>
    );
  },
  cell: getDefaultCell(),
};
