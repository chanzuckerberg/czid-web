import { cx } from "@emotion/css";
import { Cell, Getter } from "@tanstack/react-table";
import { CellBasic } from "czifui";
import React from "react";
import { NO_CONTENT_FALLBACK } from "~/components/ui/Table/constants";
import { generateWidthStyles } from "~/components/ui/Table/tableUtils";
import { memo } from "~/components/utils/memo";
import { AmrResult } from "../../../types";
import cs from "../../column_definitions.scss";
import {
  getFormattedValueAsString,
  shouldShowTooltip,
} from "../value_format_utils";

// * This file should not be changed unless you intend the change the basic default behavior
// * for all cells in the table. If you need a cell to do something other than this, consider
// * adding a custom display cell (ie: new component definition) for your column.

export enum Align {
  LEFT = "left",
  RIGHT = "right",
}

interface DefaultCellProps {
  cell: Cell<AmrResult, any>;
  getValue: Getter<any>;
}

export const getDefaultCell = (
  align?: Align,
  headerGroupClassName?: string,
) => {
  // If align is not passed in, default to left alignment
  const alignClassName =
    align === Align.RIGHT ? cs.rightAlignedCell : cs.leftAlignedCell;

  function defaultCell({ getValue, cell }: DefaultCellProps): JSX.Element {
    const rawValue = getValue();
    const formattedValue = getFormattedValueAsString(rawValue);

    return (
      <CellBasic
        className={cx(alignClassName, headerGroupClassName)}
        style={generateWidthStyles(cell.column)}
        key={cell.id}
        primaryText={formattedValue || NO_CONTENT_FALLBACK}
        shouldTextWrap
        primaryTextWrapLineCount={2}
        shouldShowTooltipOnHover={shouldShowTooltip(formattedValue)}
      />
    );
  }
  return memo(defaultCell);
};
