import { Cell, Getter } from "@tanstack/react-table";
import { CellBasic } from "czifui";
import React from "react";
import { NO_CONTENT_FALLBACK } from "~/components/ui/Table/constants";
import { AmrResult } from "../../../types";
import cs from "../../column_definitions.scss";

interface RightAlignedCellProps {
  cell: Cell<AmrResult, any>;
  getValue: Getter<any>;
}

// * This file should not be changed unless you intend the change the basic default behavior
// * for all cells in the table. If you need a cell to do something other than this, consider
// * adding a custom display cell (ie: new component definition) for your column.

export const RightAlignedCell = ({ getValue, cell }: RightAlignedCellProps) => {
  return (
    <CellBasic
      className={cs.rightAlignedCell}
      key={cell.id}
      primaryText={getValue() || NO_CONTENT_FALLBACK}
      shouldTextWrap
      primaryTextWrapLineCount={2}
      shouldShowTooltipOnHover={false}
    />
  );
};
