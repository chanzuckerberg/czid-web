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
import { READS_COVERAGE_DEPTH_TOOLTIP_STRINGS } from "./constants";

export const readCoverageDepthColumn: ColumnDef<AmrResult, any> = {
  id: "readCoverageDepth",
  accessorKey: "readCoverageDepth",
  header: function readCoverageDepthHeader({ header }) {
    return (
      <SortableHeader
        className={cx(cs.rightAlignedHeader, rowStyles.readsColumnGroup)}
        header={header}
        style={generateSlimWidthStyles()}
        tooltipStrings={READS_COVERAGE_DEPTH_TOOLTIP_STRINGS}
      >
        Cov. Depth
      </SortableHeader>
    );
  },
  cell: getDefaultCell(Align.RIGHT, rowStyles.readsColumnGroup, SlimWidth.SLIM),
};
