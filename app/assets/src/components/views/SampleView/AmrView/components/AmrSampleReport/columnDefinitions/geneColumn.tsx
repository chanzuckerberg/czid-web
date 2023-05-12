import { CellComponent } from "czifui";
import React from "react";
import { SortableHeader } from "~/components/ui/Table/components/SortableHeader";
import { generateWidthStyles } from "~/components/ui/Table/tableUtils";
import GeneCell from "./components/GeneCell";
import { GENE_COLUMN_TOOLTIP_STRINGS } from "./constants";

export function getGeneColumn(
  setDetailsSidebarGeneName: (setDetailsSidebarGeneName: string | null) => void,
) {
  return {
    id: "gene",
    accessorKey: "gene",
    size: 137,
    header: function geneHeader({ header, column }) {
      return (
        <SortableHeader
          header={header}
          style={generateWidthStyles(column)}
          tooltipStrings={GENE_COLUMN_TOOLTIP_STRINGS}
          isSortDefaultDesc={false}
        >
          Gene
        </SortableHeader>
      );
    },
    cell: function getCell({ getValue, cell }) {
      return (
        <CellComponent key={cell.id}>
          <GeneCell
            setDetailsSidebarGeneName={setDetailsSidebarGeneName}
            geneName={getValue()}
          />
        </CellComponent>
      );
    },
  };
}
