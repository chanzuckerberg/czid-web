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
import { READS_COVERAGE_DEPTH_TOOLTIP_STRINGS } from "./constants";

export const readCoverageDepthColumn: ColumnDef<AmrResult, any> = {
  id: "readCoverageDepth",
  accessorFn: function readCoverageDepthAccessor(row) {
    const rawValue = row.readCoverageDepth;
    let value: number;

    if (rawValue === null) {
      value = -1;
    } else {
      value = convertStringAndRoundToHundredths(rawValue);
    }
    return value;
  },
  size: 85,
  header: function readCoverageDepthHeader({ header, column }) {
    return (
      <SortableHeader
        className={cx(cs.rightAlignedHeader, rowStyles.readsColumnGroup)}
        header={header}
        style={generateWidthStyles(column)}
        tooltipStrings={READS_COVERAGE_DEPTH_TOOLTIP_STRINGS}
      >
        Cov. Depth
      </SortableHeader>
    );
  },
  cell: getDefaultCell(Align.RIGHT, rowStyles.readsColumnGroup),
};
