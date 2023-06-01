import { Button } from "czifui";
import React from "react";
import ReportMetadata from "~/interface/reportMetaData";
import { CurrentTabSample, FilterSelections } from "~/interface/sampleView";
import { Taxon } from "~/interface/shared";
import cs from "./report_stats_row.scss";
import { countFilters, filteredMessage, renderReportInfo } from "./utils";

interface ReportStatsRowProps {
  currentTab: CurrentTabSample;
  filteredReportData: Taxon[];
  reportData: Taxon[];
  reportMetadata: ReportMetadata;
  selectedOptions: FilterSelections;
  clearAllFilters: () => void;
}

export const ReportStatsRow = ({
  currentTab,
  filteredReportData,
  reportData,
  reportMetadata,
  selectedOptions,
  clearAllFilters,
}: ReportStatsRowProps) => {
  return (
    <div className={cs.statsRow}>
      {renderReportInfo(currentTab, reportMetadata)}
      <div className={cs.statsRowFilterInfo} data-testid={"stats-info"}>
        {filteredMessage(currentTab, filteredReportData, reportData)}
        {!!countFilters(currentTab, selectedOptions) && (
          <span className={cs.clearAllFilters}>
            <Button
              sdsStyle="minimal"
              sdsType="secondary"
              onClick={clearAllFilters}
            >
              Clear Filters
            </Button>
          </span>
        )}
      </div>
    </div>
  );
};
