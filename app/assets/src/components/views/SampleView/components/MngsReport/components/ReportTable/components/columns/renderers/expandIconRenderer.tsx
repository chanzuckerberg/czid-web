import { cx } from "@emotion/css";
import React from "react";
import { ANALYTICS_EVENT_NAMES, withAnalytics } from "~/api/analytics";
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
) => CellRendererType = (expandedGenusIds, toggleExpandGenus) =>
  function expandIconRenderer({ rowData }: { rowData: Taxon }) {
    return (
      // TODO: this should be a button not a div
      <div className={cs.expandIcon} data-testid="expand-taxon-parent">
        {rowData.taxLevel === TAX_LEVEL_GENUS ? (
          <i
            className={cx(
              "fa",
              expandedGenusIds.has(rowData.taxId)
                ? "fa-angle-down"
                : "fa-angle-right",
            )}
            onClick={withAnalytics(
              () => toggleExpandGenus({ taxonId: rowData.taxId }),
              ANALYTICS_EVENT_NAMES.PIPELINE_SAMPLE_REPORT_EXPAND_GENUS_CLICKED,
              { tax_id: rowData.taxId },
            )}
          />
        ) : (
          ""
        )}
      </div>
    );
  };
