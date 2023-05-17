import { ColumnDef } from "@tanstack/react-table";
import React from "react";
import { SortableHeader } from "~/components/ui/Table/components/SortableHeader";
import { NO_CONTENT_FALLBACK } from "~/components/ui/Table/constants";
import { generateWidthStyles } from "~/components/ui/Table/tableUtils";
import rowStyles from "../components/StyledTableRow/styled_table_row.scss";
import { AmrResult } from "../types";
import { Align, getDefaultCell } from "./components/DefaultCell";
import { CUTOFF_COLUMN_TOOLTIP_STRINGS } from "./constants";

export const cutoffColumn: ColumnDef<AmrResult, any> = {
  id: "cutoff",
  accessorKey: "cutoff",
  size: 82,
  header: function cutoffHeader({ header, column }) {
    return (
      <SortableHeader
        className={rowStyles.contigsColumnGroup}
        header={header}
        style={generateWidthStyles(column)}
        tooltipStrings={CUTOFF_COLUMN_TOOLTIP_STRINGS}
      >
        Cutoff
      </SortableHeader>
    );
  },
  cell: getDefaultCell(Align.LEFT, rowStyles.contigsColumnGroup),
  sortingFn: (a, b) => {
    // this sorting function is used to sort the table by the cutoff column
    // where values are sorted in order from Perfect -> Strict -> Nudged -> --
    // where -- is the lowest value
    const cutoffOrder = ["Perfect", "Strict", "Nudged", NO_CONTENT_FALLBACK];
    const aIndex = cutoffOrder.indexOf(
      a.getValue("cutoff") || NO_CONTENT_FALLBACK,
    );
    const bIndex = cutoffOrder.indexOf(
      b.getValue("cutoff") || NO_CONTENT_FALLBACK,
    );
    return bIndex - aIndex;
  },
};
