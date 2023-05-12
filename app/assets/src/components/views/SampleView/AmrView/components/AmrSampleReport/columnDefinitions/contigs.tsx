import { cx } from "@emotion/css";
import { ColumnDef } from "@tanstack/react-table";
import React from "react";
import { SortableHeader } from "~/components/ui/Table/components/SortableHeader";
import { generateWidthStyles } from "~/components/ui/Table/tableUtils";
import rowStyles from "../components/StyledTableRow/styled_table_row.scss";
import { AmrResult } from "../types";
import cs from "./column_definitions.scss";
import { Align, getDefaultCell } from "./components/DefaultCell";
import { CONTIGS_COLUMN_TOOLTIP_STRINGS } from "./constants";

export const contigsColumn: ColumnDef<AmrResult, any> = {
  id: "contigs",
  accessorKey: "contigs",
  size: 91,
  header: function contigsHeader({ header, column }) {
    return (
      <SortableHeader
        className={cx(cs.rightAlignedHeader, rowStyles.contigsColumnGroup)}
        header={header}
        style={generateWidthStyles(column)}
        tooltipStrings={CONTIGS_COLUMN_TOOLTIP_STRINGS}
      >
        Contigs
      </SortableHeader>
    );
  },
  cell: getDefaultCell(Align.RIGHT, rowStyles.contigsColumnGroup),
};
