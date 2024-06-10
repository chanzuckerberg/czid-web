import { cx } from "@emotion/css";
import React from "react";
import { WithAnalyticsType } from "~/api/analytics";
import cs from "~/components/views/SampleView/components/MngsReport/components/ReportTable/report_table.scss";
import { HeaderRendererType } from "~/interface/sampleView";

// The output of this function is passed to headerRenderer which takes a function of type HeaderRendererType
// This returns a function that returns a component, this does not return the
// component directly
export const getExpandIconHeaderRenderer: (
  isExpandAllOpened: boolean,
  toggleExpandAll: () => void,
  withAnalytics: WithAnalyticsType,
) => HeaderRendererType = (isExpandAllOpened, toggleExpandAll) =>
  function expandIconHeaderRenderer() {
    return (
      <button
        className={cx(cs.expandIcon, "noStyleButton")}
        data-testid="expand-taxon-parent-all"
        onClick={() => toggleExpandAll()}
      >
        <i
          className={cx(
            "fa",
            isExpandAllOpened ? "fa-angle-down" : "fa-angle-right",
          )}
        />
      </button>
    );
  };
