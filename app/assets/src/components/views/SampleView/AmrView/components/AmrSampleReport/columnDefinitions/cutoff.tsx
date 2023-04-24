import { ColumnDef } from "@tanstack/react-table";
import React from "react";
import { SortableHeader } from "~/components/ui/Table/components/SortableHeader";
import { generateWidthStyles } from "~/components/ui/Table/tableUtils";
import rowStyles from "../components/StyledTableRow/styled_table_row.scss";
import { AmrResult } from "../types";
import { Align, getDefaultCell } from "./components/DefaultCell";
import { CUTOFF_COLUMN_TOOLTIP_STRINGS } from "./constants";

export const cutoffColumn: ColumnDef<AmrResult, any> = {
  id: "cutoff",
  accessorKey: "cutoff",
  size: 85,
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
};
