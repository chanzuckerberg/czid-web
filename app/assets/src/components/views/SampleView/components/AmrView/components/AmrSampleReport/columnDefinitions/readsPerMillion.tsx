import { cx } from "@emotion/css";
import { ColumnDef } from "@tanstack/react-table";
import React from "react";
import { SortableHeader } from "~/components/ui/Table/components/SortableHeader";
import { generateWidthStyles } from "~/components/ui/Table/tableUtils";
import rowStyles from "../components/StyledTableRow/styled_table_row.scss";
import { AmrResult } from "../types";
import cs from "./column_definitions.scss";
import { Align, getDefaultCell } from "./components/DefaultCell";
import { READS_RPM_COLUMN_TOOLTIP_STRINGS } from "./constants";

export const readsPerMillionColumn: ColumnDef<AmrResult, any> = {
  id: "rpm",
  accessorFn: function rpmAccessor(row) {
    return row.rpm === null ? -1 : row.rpm;
  },
  size: 84,
  header: function readsPerMillionHeader({ header, column }) {
    return (
      <SortableHeader
        className={cx(cs.rightAlignedHeader, rowStyles.readsColumnGroup)}
        header={header}
        style={generateWidthStyles(column)}
        tooltipStrings={READS_RPM_COLUMN_TOOLTIP_STRINGS}
      >
        rPM
      </SortableHeader>
    );
  },
  cell: getDefaultCell(Align.RIGHT, rowStyles.readsColumnGroup),
};
