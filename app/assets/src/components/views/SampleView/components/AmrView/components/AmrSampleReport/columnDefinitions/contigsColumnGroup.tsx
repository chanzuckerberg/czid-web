import { Button } from "@czi-sds/components";
import KeyboardDoubleArrowLeftIcon from "@mui/icons-material/KeyboardDoubleArrowLeft";
import KeyboardDoubleArrowRightIcon from "@mui/icons-material/KeyboardDoubleArrowRight";
import { ColumnDef, Table } from "@tanstack/react-table";
import React from "react";
import { generateHeaderWidthStyles } from "~/components/ui/Table/tableUtils";
import { ColumnSection } from "~/components/views/SampleView/components/AmrView/constants";
import { AmrResult } from "../types";
import cs from "./column_definitions.scss";
import {
  handleSectionOpenToggled,
  isAllColumnsVisible,
} from "./columnDefUtils";

export const getContigsColumnGroup = (
  columns: ColumnDef<AmrResult, any>[],
  table: Table<any>,
) => {
  return {
    id: "contigsHeaderGroup",
    colspan: columns.length,
    header: function contigsGroupHeader({ header }) {
      const isSectionOpen = isAllColumnsVisible(columns, table);

      return (
        <th
          key={`header-${header.id}`}
          className={cs.groupedHeader}
          colSpan={header.colSpan}
          style={generateHeaderWidthStyles(header)}
        >
          <Button
            className={cs.groupedHeaderButton}
            onClick={() =>
              handleSectionOpenToggled(
                table,
                isSectionOpen,
                ColumnSection.CONTIGS,
              )
            }
            sdsType="secondary"
            sdsStyle="minimal"
            isAllCaps={false}
          >
            {isSectionOpen ? (
              <KeyboardDoubleArrowLeftIcon fontSize="inherit" />
            ) : (
              <KeyboardDoubleArrowRightIcon fontSize="inherit" />
            )}
            <span>Contigs</span>
          </Button>
        </th>
      );
    },
    columns: columns,
  };
};
