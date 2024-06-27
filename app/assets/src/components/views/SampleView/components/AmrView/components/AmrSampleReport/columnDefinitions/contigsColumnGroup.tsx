import { Button, Icon } from "@czi-sds/components";
import { ColumnDef, Table } from "@tanstack/react-table";
import React from "react";
import { generateHeaderWidthStyles } from "~/components/ui/Table/tableUtils";
import { ColumnSection } from "~/components/views/SampleView/components/AmrView/constants";
import { AmrResult } from "../types";
import {
  handleSectionOpenToggled,
  isAllColumnsVisible,
} from "./columnDefUtils";
import cs from "./column_definitions.scss";

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
          data-testid="contigs-group-header"
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
              <Icon sdsIcon="chevronLeft2" sdsSize="xs" sdsType="static" />
            ) : (
              <Icon sdsIcon="chevronRight2" sdsSize="xs" sdsType="static" />
            )}
            <span>Contigs</span>
          </Button>
        </th>
      );
    },
    columns: columns,
  };
};
