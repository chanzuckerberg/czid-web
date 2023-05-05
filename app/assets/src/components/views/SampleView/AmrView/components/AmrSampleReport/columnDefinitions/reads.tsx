import { cx } from "@emotion/css";
import { ColumnDef } from "@tanstack/react-table";
import { CellBasic } from "czifui";
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
  accessorKey: "reads",
  size: 85,
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
    const rawValue = getValue();
    let value: string;

    if (rawValue === null) {
      value = NO_CONTENT_FALLBACK;
    } else {
      // Parse the string to an int, we won't have partial reads
      value = `${parseInt(rawValue)}`;
    }

    return (
      <CellBasic
        className={cx(cs.rightAlignedCell, rowStyles.readsColumnGroup)}
        key={cell.id}
        style={generateWidthStyles(cell.column)}
        shouldTextWrap
        primaryText={value}
        primaryTextWrapLineCount={2}
        shouldShowTooltipOnHover={false}
      />
    );
  }),
};
