import { cx } from "@emotion/css";
import { ColumnDef } from "@tanstack/react-table";
import React from "react";
import { SortableHeader } from "~/components/ui/Table/components/SortableHeader";
import { generateWidthStyles } from "~/components/ui/Table/tableUtils";
import { convertStringAndRoundToHundredths } from "~/components/utils/numberUtil";
import rowStyles from "../components/StyledTableRow/styled_table_row.scss";
import { AmrResult } from "../types";
import cs from "./column_definitions.scss";
import { Align, getDefaultCell } from "./components/DefaultCell";
import { READS_PERCENT_COVERAGE_COLUMN_TOOLTIP_STRINGS } from "./constants";

export const readCoverageBreadthColumn: ColumnDef<AmrResult, any> = {
  id: "readCoverageBreadth",
  accessorFn: function readCoverageBreadthAccessor(row) {
    const rawValue = row.readCoverageBreadth;
    let value: number;

    if (rawValue === null) {
      value = -1;
    } else {
      // Parse the string to a number, round it to the hundredths place and convert it back to a string.
      value = convertStringAndRoundToHundredths(rawValue);
    }
    return value;
  },
  size: 77,
  header: function readCoverageBreadthHeader({ header, column }) {
    return (
      <SortableHeader
        className={cx(cs.rightAlignedHeader, rowStyles.readsColumnGroup)}
        header={header}
        style={generateWidthStyles(column)}
        tooltipStrings={READS_PERCENT_COVERAGE_COLUMN_TOOLTIP_STRINGS}
      >
        %Cov
      </SortableHeader>
    );
  },
  cell: getDefaultCell(Align.RIGHT, rowStyles.readsColumnGroup),
};
