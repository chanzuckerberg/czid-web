import { CellBasic } from "@czi-sds/components";
import { cx } from "@emotion/css";
import { ColumnDef } from "@tanstack/react-table";
import React from "react";
import { SortableHeader } from "~/components/ui/Table/components/SortableHeader";
import { NO_CONTENT_FALLBACK } from "~/components/ui/Table/constants";
import { generateWidthStyles } from "~/components/ui/Table/tableUtils";
import rowStyles from "../components/StyledTableRow/styled_table_row.scss";
import { AmrResult } from "../types";
import cs from "./column_definitions.scss";
import {
  getFormattedCutoffStringValue,
  sortCutoffColumnFn,
} from "./components/valueFormatUtils";
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
  sortingFn: (a, b) => sortCutoffColumnFn(a, b),
  cell: function getCell({ getValue, cell }) {
    const formattedValue = getFormattedCutoffStringValue(getValue());
    return (
      <CellBasic
        className={cx(cs.leftAlignedCell, rowStyles.contigsColumnGroup)}
        style={generateWidthStyles(cell.column)}
        key={cell.id}
        primaryText={formattedValue}
        shouldTextWrap
        primaryTextWrapLineCount={2}
        shouldShowTooltipOnHover={formattedValue !== NO_CONTENT_FALLBACK}
      />
    );
  },
};
