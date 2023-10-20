import { cx } from "@emotion/css";
import React from "react";
import { ANALYTICS_EVENT_NAMES, WithAnalyticsType } from "~/api/analytics";
import cs from "~/components/views/SampleView/components/MngsReport/components/ReportTable/report_table.scss";
import { HeaderRendererType } from "~/interface/sampleView";

// The output of this function is passed to headerRenderer which takes a function of type HeaderRendererType
// This returns a function that returns a component, this does not return the
// component directly
export const getExpandIconHeaderRenderer: (
  isExpandAllOpened: boolean,
  toggleExpandAll: () => void,
  withAnalytics: WithAnalyticsType,
) => HeaderRendererType = (isExpandAllOpened, toggleExpandAll, withAnalytics) =>
  function expandIconHeaderRenderer() {
    return (
      <div className={cs.expandIcon} data-testid="expand-taxon-parent-all">
        <i
          className={cx(
            "fa",
            isExpandAllOpened ? "fa-angle-down" : "fa-angle-right",
          )}
          onClick={withAnalytics(
            () => toggleExpandAll(),
            ANALYTICS_EVENT_NAMES.PIPELINE_SAMPLE_REPORT_EXPAND_ALL_CLICKED,
          )}
        />
      </div>
    );
  };
