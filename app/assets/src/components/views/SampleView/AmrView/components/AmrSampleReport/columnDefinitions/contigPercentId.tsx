import { ColumnDef } from "@tanstack/react-table";
import { CellBasic } from "czifui";
import React from "react";
import { SortableHeader } from "~/components/ui/Table/components/SortableHeader";
import { NO_CONTENT_FALLBACK } from "~/components/ui/Table/constants";
import { generateWidthStyles } from "~/components/ui/Table/tableUtils";
import { memo } from "~/components/utils/memo";
import { AmrResult } from "../types";
import cs from "./column_definitions.scss";

export const contigPercentIdColumn: ColumnDef<AmrResult, any> = {
  id: "contig-percent-id",
  accessorKey: "contigPercentId",
  size: 70,
  header: function contigPercentIdHeader({ header, column }) {
    return (
      <SortableHeader
        className={cs.rightAlignedHeader}
        header={header}
        style={generateWidthStyles(column)}>
        %Id
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
      value = `${Math.round(parseFloat(rawValue) * 100) / 100} %`;
    }

    return (
      <CellBasic
        className={cs.rightAlignedCell}
        key={cell.id}
        shouldTextWrap
        primaryText={value}
        primaryTextWrapLineCount={2}
        shouldShowTooltipOnHover={false}
      />
    );
  }),
};
