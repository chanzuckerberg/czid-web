import { Icon, Tooltip } from "@czi-sds/components";
import React from "react";
import ColumnHeaderTooltip from "~/components/ui/containers/ColumnHeaderTooltip";
import { BACKGROUND_MODELS_LINK } from "~/components/utils/documentationLinks";
import cs from "~/components/views/SampleView/components/MngsReport/components/ReportTable/report_table.scss";
import { numberWithCommas } from "~/helpers/strings";
import { CellRendererType } from "~/interface/sampleView";
import { Taxon } from "~/interface/shared";

// The output of this function is passed to cellRenderer which takes a function of type CellRendererType
// This returns a function that returns a component, this does not return the
// component directly
export const getAggregateScoreRenderer: (
  displayNoBackground: boolean,
  displayMergedNtNrValue: boolean,
) => CellRendererType = (displayNoBackground, displayMergedNtNrValue) =>
  function aggregateScoreRenderer({
    cellData,
    rowData,
  }: {
    cellData: number;
    rowData: Taxon;
  }) {
    if (displayNoBackground || displayMergedNtNrValue) {
      return (
        <ColumnHeaderTooltip
          trigger={<div className={cs.noData}>-</div>}
          content={
            "To see the Aggregate Score, first choose a background model above."
          }
          link={BACKGROUND_MODELS_LINK}
        />
      );
    } else {
      return (
        <div className={cs.annotatedData}>
          <div className={cs.icon}>
            {rowData.highlighted && (
              <Tooltip
                arrow
                placement="top"
                sdsStyle="light"
                title="Highest-scoring organisms satisfying certain thresholds"
              >
                <span>
                  <Icon sdsIcon="lightBulb" sdsSize="s" sdsType="static" />
                </span>
              </Tooltip>
            )}
          </div>
          <div className={cs.data}>
            {numberWithCommas(Number(cellData).toFixed(0))}
          </div>
        </div>
      );
    }
  };
