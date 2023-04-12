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
    id: "gene-info-header-group",
    colspan: columns.length,
    header: function geneInfoGroupHeader({ header }) {
      return (
        <th
          key={`header-${header.id}`}
          className={cs.rowCount}
          colSpan={header.colSpan}
          style={generateHeaderWidthStyles(header)}
        >
          {!!nRows && `${nRows} Rows`}
        </th>
      );
    },
    columns: columns,
  };
};
