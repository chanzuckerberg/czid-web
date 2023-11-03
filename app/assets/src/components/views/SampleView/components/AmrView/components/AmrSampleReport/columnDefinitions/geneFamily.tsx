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
import { GENE_FAMILY_COLUMN_TOOLTIP_STRINGS } from "./constants";

export const geneFamilyColumn: ColumnDef<AmrResult, any> = {
  id: "geneFamily",
  accessorFn: function geneFamilyAccessor(row): string {
    // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2322
    return getFormattedCompoundString(row.geneFamily);
  },
  sortingFn: sortStringOrFallback,
  size: 200,
  minSize: 200,
  header: function geneFamilyHeader({ header, column }) {
    return (
      <SortableHeader
        header={header}
        style={generateWidthStyles(column)}
        tooltipStrings={GENE_FAMILY_COLUMN_TOOLTIP_STRINGS}
        isSortDefaultDesc={false}
      >
        Gene Family
      </SortableHeader>
    );
  },
  cell: getDefaultCell(),
};
