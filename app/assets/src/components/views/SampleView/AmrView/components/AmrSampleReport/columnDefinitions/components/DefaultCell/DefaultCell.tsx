import { Cell, Getter } from "@tanstack/react-table";
import { CellBasic } from "czifui";
import React from "react";
import { NO_CONTENT_FALLBACK } from "~/components/ui/Table/constants";
import { memo } from "~/components/utils/memo";
import { AmrResult } from "../../../types";
import cs from "../../column_definitions.scss";

// * This file should not be changed unless you intend the change the basic default behavior
// * for all cells in the table. If you need a cell to do something other than this, consider
// * adding a custom display cell (ie: new component definition) for your column.

interface DefaultCellProps {
  cell: Cell<AmrResult, any>;
  getValue: Getter<any>;
}

function defaultCell({ getValue, cell }: DefaultCellProps): JSX.Element {
  return (
    <CellBasic
      className={cs.leftAlignedCell}
      key={cell.id}
      primaryText={getValue() || NO_CONTENT_FALLBACK}
      shouldTextWrap
      primaryTextWrapLineCount={2}
      shouldShowTooltipOnHover={false}
    />
  );
}

export const DefaultCell = memo(defaultCell);
