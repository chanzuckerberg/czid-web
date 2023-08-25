import React from "react";
import ColumnHeaderTooltip from "~/components/ui/containers/ColumnHeaderTooltip";
import { BACKGROUND_MODELS_LINK } from "~/components/utils/documentationLinks";
import cs from "~/components/views/SampleView/components/MngsReport/components/ReportTable/report_table.scss";
import { CellRendererType, DBType } from "~/interface/sampleView";
import { CellValue } from "../components/CellValue";

// The output of this function is passed to cellRenderer which takes a function of type CellRendererType
// This returns a function that returns a component, this does not return the
// component directly
export const getZScoreRenderer: (
  dbType: DBType,
  displayNoBackground: boolean,
) => CellRendererType = (dbType, displayNoBackground) =>
  function zScoreRenderer({ cellData }: { cellData: Array<number> }) {
    if (displayNoBackground) {
      return (
        <ColumnHeaderTooltip
          trigger={<div className={cs.noData}>-</div>}
          content={"To see the Z Score, first choose a background model above."}
          link={BACKGROUND_MODELS_LINK}
        />
      );
    } else {
      return cellData ? (
        <CellValue cellData={cellData} dbType={dbType} decimalPlaces={1} />
      ) : (
        "-"
      );
    }
  };
