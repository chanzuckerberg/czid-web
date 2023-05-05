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
import { CONTIGS_SPECIES_COLUMN_TOOLTIP_STRINGS } from "./constants";

export const contigSpeciesColumn: ColumnDef<AmrResult, any> = {
  id: "contigSpecies",
  accessorKey: "contigSpecies",
  size: 200,
  header: function contigSpeciesHeader({ header, column }) {
    return (
      <SortableHeader
        className={rowStyles.contigsColumnGroup}
        header={header}
        style={generateWidthStyles(column)}
        tooltipStrings={CONTIGS_SPECIES_COLUMN_TOOLTIP_STRINGS}
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
    let value = getValue();
    value = !value ? NO_CONTENT_FALLBACK : value;

    return (
      <CellBasic
        className={cx(cs.leftAlignedCell, rowStyles.contigsColumnGroup)}
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
