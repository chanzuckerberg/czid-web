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
import { HIGH_LEVEL_DRUG_CLASS_COLUMN_TOOLTIP_STRINGS } from "./constants";

export const highLevelDrugClassColumn: ColumnDef<AmrResult, any> = {
  id: "highLevelDrugClass",
  accessorFn: function highLevelDrugClassAccessor(row): string {
    // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2322
    return getFormattedCompoundString(row.highLevelDrugClass);
  },
  sortingFn: sortStringOrFallback,
  size: 200,
  header: function drugClassHeader({ header, column }) {
    return (
      <SortableHeader
        header={header}
        style={generateWidthStyles(column)}
        tooltipStrings={HIGH_LEVEL_DRUG_CLASS_COLUMN_TOOLTIP_STRINGS}
        isSortDefaultDesc={false}
      >
        High-level Drug Class
      </SortableHeader>
    );
  },
  cell: getDefaultCell(),
};
