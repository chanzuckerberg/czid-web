import { cx } from "@emotion/css";
import { ColumnDef } from "@tanstack/react-table";
import { CellBasic, Tag } from "czifui";
import React from "react";
import { SortableHeader } from "~/components/ui/Table/components/SortableHeader";
import { NO_CONTENT_FALLBACK } from "~/components/ui/Table/constants";
import { generateWidthStyles } from "~/components/ui/Table/tableUtils";
import { memo } from "~/components/utils/memo";
import rowStyles from "../components/StyledTableRow/styled_table_row.scss";
import { AmrResult } from "../types";
import cs from "./column_definitions.scss";
import {
  getFormattedCompoundString,
  shouldShowTooltip,
  sortStringOrFallback,
} from "./components/valueFormatUtils";
import { CONTIGS_SPECIES_COLUMN_TOOLTIP_STRINGS } from "./constants";

export const contigSpeciesColumn: ColumnDef<AmrResult, any> = {
  id: "contigSpecies",
  accessorFn: function contigSpeciesAccessor(row) {
    return getFormattedCompoundString(row.contigSpecies);
  },
  sortingFn: sortStringOrFallback,
  size: 200,
  minSize: 200,
  header: function contigSpeciesHeader({ header, column }) {
    return (
      <SortableHeader
        className={rowStyles.contigsColumnGroup}
        header={header}
        style={generateWidthStyles(column)}
        tooltipStrings={CONTIGS_SPECIES_COLUMN_TOOLTIP_STRINGS}
        isSortDefaultDesc={false}
      >
        <div className={cs.headerWithTagContainer}>
          <span>Contig Species</span>
          <Tag
            className={cs.tag}
            label="BETA"
            color="beta"
            sdsType="secondary"
            sdsStyle="rounded"
            hover={false}
          />
        </div>
      </SortableHeader>
    );
  },
  cell: memo(({ getValue, cell }) => {
    const value = getValue();

    return (
      <CellBasic
        className={cx(cs.leftAlignedCell, rowStyles.contigsColumnGroup)}
        key={cell.id}
        style={generateWidthStyles(cell.column)}
        shouldTextWrap
        primaryText={value || NO_CONTENT_FALLBACK}
        primaryTextWrapLineCount={2}
        shouldShowTooltipOnHover={shouldShowTooltip(value)}
      />
    );
  }),
};
