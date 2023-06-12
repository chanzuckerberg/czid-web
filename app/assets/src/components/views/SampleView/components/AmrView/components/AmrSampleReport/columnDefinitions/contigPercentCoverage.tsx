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
import { CONTIGS_PERCENT_COVERAGE_COLUMN_TOOLTIP_STRINGS } from "./constants";

export const contigPercentCoverageColumn: ColumnDef<AmrResult, any> = {
  id: "contigCoverageBreadth",
  accessorKey: "contigCoverageBreadth",
  size: 77,
  header: function contigPercentCoverageHeader({ header, column }) {
    return (
      <SortableHeader
        className={cx(cs.rightAlignedHeader, rowStyles.contigsColumnGroup)}
        header={header}
        style={generateWidthStyles(column)}
        tooltipStrings={CONTIGS_PERCENT_COVERAGE_COLUMN_TOOLTIP_STRINGS}
      >
        %Cov
      </SortableHeader>
    );
  },
  cell: memo(({ getValue, cell }) => {
    const rawValue = getValue();
    let value: string;

    if (rawValue === null) {
      value = NO_CONTENT_FALLBACK;
    } else {
      // Parse the string to a number, round it to the hundredths place and convert it back to a string.
      value = `${Math.round(parseFloat(rawValue) * 100) / 100}`;
    }

    return (
      <CellBasic
        className={cx(cs.rightAlignedCell, rowStyles.contigsColumnGroup)}
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
