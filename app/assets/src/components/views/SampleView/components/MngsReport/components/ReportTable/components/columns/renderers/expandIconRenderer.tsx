import { cx } from "@emotion/css";
import React from "react";
import { WithAnalyticsType } from "~/api/analytics";
import cs from "~/components/views/SampleView/components/MngsReport/components/ReportTable/report_table.scss";
import { TAX_LEVEL_GENUS } from "~/components/views/SampleView/utils";
import { CellRendererType } from "~/interface/sampleView";
import { Taxon } from "~/interface/shared";

// The output of this function is passed to cellRenderer which takes a function of type CellRendererType
// This returns a function that returns a component, this does not return the
// component directly
export const getExpandIconRenderer: (
  expandedGenusIds: Set<number>,
  toggleExpandGunus: ({ taxonId }: { taxonId: number }) => void,
  withAnalytics: WithAnalyticsType,
) => CellRendererType = (expandedGenusIds, toggleExpandGenus) =>
  function expandIconRenderer({ rowData }: { rowData: Taxon }) {
    return (
      <div data-testid="expand-taxon-parent">
        {rowData.taxLevel === TAX_LEVEL_GENUS ? (
          <button
            className={cx(cs.expandIcon, "noStyleButton")}
            onClick={() => toggleExpandGenus({ taxonId: rowData.taxId })}
          >
            <i
              className={cx(
                "fa",
                expandedGenusIds.has(rowData.taxId)
                  ? "fa-angle-down"
                  : "fa-angle-right",
              )}
            />
          </button>
        ) : (
          ""
        )}
      </div>
    );
  };
