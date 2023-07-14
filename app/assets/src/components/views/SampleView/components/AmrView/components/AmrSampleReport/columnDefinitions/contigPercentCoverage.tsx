import { CellBasic } from "@czi-sds/components";
import { cx } from "@emotion/css";
import { ColumnDef } from "@tanstack/react-table";
import React from "react";
import { SortableHeader } from "~/components/ui/Table/components/SortableHeader";
import { NO_CONTENT_FALLBACK } from "~/components/ui/Table/constants";
import { generateWidthStyles } from "~/components/ui/Table/tableUtils";
import { memo } from "~/components/utils/memo";
import { convertStringAndRoundToHundredths } from "~/components/utils/numberUtil";
import rowStyles from "../components/StyledTableRow/styled_table_row.scss";
import { AmrResult } from "../types";
import cs from "./column_definitions.scss";
import { CONTIGS_PERCENT_COVERAGE_COLUMN_TOOLTIP_STRINGS } from "./constants";

export const contigPercentCoverageColumn: ColumnDef<AmrResult, any> = {
  id: "contigCoverageBreadth",
  accessorFn: function contigPercentCoverageAccessor(row) {
    const rawValue = row.contigCoverageBreadth;
    let value: number;

    if (rawValue === null) {
      value = -1;
    } else {
      value = convertStringAndRoundToHundredths(rawValue);
    }
    return value;
  },
  size: 90,
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
    return (
      <CellBasic
        className={cx(cs.rightAlignedCell, rowStyles.contigsColumnGroup)}
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
