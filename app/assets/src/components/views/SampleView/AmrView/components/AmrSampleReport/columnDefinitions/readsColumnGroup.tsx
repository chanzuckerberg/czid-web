import { ColumnDef } from "@tanstack/react-table";
import React from "react";
import { generateHeaderWidthStyles } from "~/components/ui/Table/tableUtils";
import { AmrResult } from "../types";
import cs from "./column_definitions.scss";

export const getReadsColumnGroup = (columns: ColumnDef<AmrResult, any>[]) => {
  return {
    id: "reads-header-group",
    colspan: columns.length,
    header: function readsGroupHeader({ header }) {
      return (
        <th
          key={`header-${header.id}`}
          className={cs.groupedHeader}
          colSpan={header.colSpan}
          style={generateHeaderWidthStyles(header)}
        >
          Reads
        </th>
      );
    },
    columns: columns,
  };
};
