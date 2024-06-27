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

export const getReadsColumnGroup = (
  columns: ColumnDef<AmrResult, any>[],
  table: Table<any>,
) => {
  return {
    id: "readsHeaderGroup",
    colspan: columns.length,
    header: function readsGroupHeader({ header }) {
      const isSectionOpen = isAllColumnsVisible(columns, table);

      return (
        <th
          data-testid="reads-group-header"
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
                ColumnSection.READS,
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
            <span>Reads</span>
          </Button>
        </th>
      );
    },
    columns: columns,
  };
};
