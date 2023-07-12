import { CellBasic } from "@czi-sds/components";
import { cx } from "@emotion/css";
import { ColumnDef } from "@tanstack/react-table";
import React from "react";
import { SortableHeader } from "~/components/ui/Table/components/SortableHeader";
import { NO_CONTENT_FALLBACK } from "~/components/ui/Table/constants";
import { generateWidthStyles } from "~/components/ui/Table/tableUtils";
import { memo } from "~/components/utils/memo";
import rowStyles from "../components/StyledTableRow/styled_table_row.scss";
import { AmrResult } from "../types";
import cs from "./column_definitions.scss";
import { READS_COLUMN_TOOLTIP_STRINGS } from "./constants";

export const readsColumn: ColumnDef<AmrResult, any> = {
  id: "reads",
  accessorFn: function readsAccessor(row) {
    const rawValue = row.reads;
    let value: number;

    if (rawValue === null) {
      value = -1;
    } else {
      // Parse the string to a number, round it to the hundredths place and convert it back to a string.
      value = parseFloat(rawValue);
    }
    return value;
  },
  size: 82,
  header: function readsHeader({ header, column }) {
    return (
      <SortableHeader
        className={cx(cs.rightAlignedHeader, rowStyles.readsColumnGroup)}
        header={header}
        style={generateWidthStyles(column)}
        tooltipStrings={READS_COLUMN_TOOLTIP_STRINGS}
      >
        Reads
      </SortableHeader>
    );
  },
  cell: memo(({ getValue, cell }) => {
    return (
      <CellBasic
        className={cx(cs.rightAlignedCell, rowStyles.readsColumnGroup)}
        key={cell.id}
        style={generateWidthStyles(cell.column)}
        shouldTextWrap
        primaryText={getValue() === -1 ? NO_CONTENT_FALLBACK : getValue()}
        primaryTextWrapLineCount={2}
        shouldShowTooltipOnHover={false}
      />
    );
  }),
};
