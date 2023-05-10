import { cx } from "@emotion/css";
import { ColumnDef } from "@tanstack/react-table";
import { CellBasic, Tag } from "czifui";
import React from "react";
import { SortableHeader } from "~/components/ui/Table/components/SortableHeader";
import { generateWidthStyles } from "~/components/ui/Table/tableUtils";
import { memo } from "~/components/utils/memo";
import rowStyles from "../components/StyledTableRow/styled_table_row.scss";
import { AmrResult } from "../types";
import cs from "./column_definitions.scss";
import {
  getFormattedValueAsString,
  shouldShowTooltip,
} from "./components/value_format_utils";
import { READS_SPECIES_COLUMN_TOOLTIP_STRINGS } from "./constants";

export const readSpeciesColumn: ColumnDef<AmrResult, any> = {
  id: "readSpecies",
  accessorKey: "readSpecies",
  size: 200,
  minSize: 200,
  header: function readSpeciesHeader({ header, column }) {
    return (
      <SortableHeader
        className={rowStyles.readsColumnGroup}
        header={header}
        style={generateWidthStyles(column)}
        tooltipStrings={READS_SPECIES_COLUMN_TOOLTIP_STRINGS}
      >
        <div className={cs.headerWithTagContainer}>
          <span>Read Species</span>
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
    const rawValue = getValue();
    const formattedValue = getFormattedValueAsString(rawValue);

    return (
      <CellBasic
        className={cx(cs.leftAlignedCell, rowStyles.readsColumnGroup)}
        key={cell.id}
        style={generateWidthStyles(cell.column)}
        shouldTextWrap
        primaryText={formattedValue}
        primaryTextWrapLineCount={2}
        shouldShowTooltipOnHover={shouldShowTooltip(formattedValue)}
      />
    );
  }),
};
