import { ColumnDef } from "@tanstack/react-table";
import React from "react";
import { generateHeaderWidthStyles } from "~/components/ui/Table/tableUtils";
import { AmrResult } from "../types";
import cs from "./column_definitions.scss";

export const getGeneInfoColumnGroup = (
  columns: ColumnDef<AmrResult, any>[],
  nRows: number,
) => {
  return {
    id: "geneInfoHeaderGroup",
    colspan: columns.length,
    header: function geneInfoGroupHeader({ header }) {
      return (
        <th
          data-testid="gene-info-group-header"
          key={`header-${header.id}`}
          className={cs.rowCountHeader}
          colSpan={header.colSpan}
          style={generateHeaderWidthStyles(header)}
        >
          {!!nRows && (
            <span className={cs.rowCount}>{`${nRows} ${
              nRows === 1 ? "Row" : "Rows"
            }`}</span>
          )}
        </th>
      );
    },
    columns: columns,
  };
};
