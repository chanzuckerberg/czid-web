import { ColumnDef } from "@tanstack/react-table";
import React from "react";
import { SortableHeader } from "~/components/ui/Table/components/SortableHeader";
import { generateSlimWidthStyles } from "~/components/ui/Table/tableUtils";
import rowStyles from "../components/StyledTableRow/styled_table_row.scss";
import { AmrResult } from "../types";
import { Align, getDefaultCell } from "./components/DefaultCell";
import { SlimWidth } from "./components/DefaultCell/DefaultCell";
import { CUTOFF_COLUMN_TOOLTIP_STRINGS } from "./constants";

export const cutoffColumn: ColumnDef<AmrResult, any> = {
  id: "cutoff",
  accessorKey: "cutoff",
  header: function cutoffHeader({ header }) {
    return (
      <SortableHeader
        className={rowStyles.contigsColumnGroup}
        header={header}
        style={generateSlimWidthStyles()}
        tooltipStrings={CUTOFF_COLUMN_TOOLTIP_STRINGS}
      >
        Cutoff
      </SortableHeader>
    );
  },
  cell: getDefaultCell(
    Align.LEFT,
    rowStyles.contigsColumnGroup,
    SlimWidth.SLIM,
  ),
};
