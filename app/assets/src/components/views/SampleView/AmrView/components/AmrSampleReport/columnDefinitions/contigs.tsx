import { cx } from "@emotion/css";
import { ColumnDef } from "@tanstack/react-table";
import React from "react";
import { SortableHeader } from "~/components/ui/Table/components/SortableHeader";
import { generateSlimWidthStyles } from "~/components/ui/Table/tableUtils";
import rowStyles from "../components/StyledTableRow/styled_table_row.scss";
import { AmrResult } from "../types";
import cs from "./column_definitions.scss";
import { Align, getDefaultCell } from "./components/DefaultCell";
import { SlimWidth } from "./components/DefaultCell/DefaultCell";
import { CONTIGS_COLUMN_TOOLTIP_STRINGS } from "./constants";

export const contigsColumn: ColumnDef<AmrResult, any> = {
  id: "contigs",
  accessorKey: "contigs",
  header: function contigsHeader({ header }) {
    return (
      <SortableHeader
        className={cx(cs.rightAlignedHeader, rowStyles.contigsColumnGroup)}
        header={header}
        style={generateSlimWidthStyles()}
        tooltipStrings={CONTIGS_COLUMN_TOOLTIP_STRINGS}
      >
        Contigs
      </SortableHeader>
    );
  },
  cell: getDefaultCell(
    Align.RIGHT,
    rowStyles.contigsColumnGroup,
    SlimWidth.SLIM,
  ),
};
