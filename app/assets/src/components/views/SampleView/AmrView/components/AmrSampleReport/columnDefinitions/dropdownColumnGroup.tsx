import { cx } from "@emotion/css";
import { CellBasic, CellHeader } from "czifui";
import React from "react";
import {
  generateHeaderWidthStyles,
  generateWidthStyles,
} from "~/components/ui/Table/tableUtils";
import { memo } from "~/components/utils/memo";
import { ToggleVisibleColumnsDropdown } from "../components/ToggleVisibleColumnsDropdown";
import cs from "./column_definitions.scss";

export const dropdownColumnGroup = {
  id: "dropdownHeaderGroup",
  colspan: 1,
  header: function dropdownGroupHeader({ header }) {
    return (
      <td
        key={`header-${header.id}`}
        className={cs.groupedHeaderPlaceholder}
        colSpan={header.colSpan}
        style={generateHeaderWidthStyles(header)}
      />
    );
  },
  columns: [
    {
      id: "dropdown",
      accessorKey: "",
      size: 10,
      header: function dropdownHeader({ column, table }) {
        return (
          <CellHeader
            hideSortIcon={true}
            horizontalAlign="left"
            style={generateWidthStyles(column)}
          >
            <ToggleVisibleColumnsDropdown table={table} />
          </CellHeader>
        );
      },
      cell: memo(({ cell }) => {
        return (
          <CellBasic
            className={cx(cs.leftAlignedCell)}
            key={cell.id}
            style={generateWidthStyles(cell.column)}
            shouldTextWrap
            primaryText={""}
            primaryTextWrapLineCount={2}
            shouldShowTooltipOnHover={false}
          />
        );
      }),
    },
  ],
};
