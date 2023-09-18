import { isNil } from "lodash";
import React from "react";
import { ANALYTICS_EVENT_NAMES, withAnalytics } from "~/api/analytics";
import { WORKFLOW_TABS } from "~/components/utils/workflows";
import { SampleViewMessage } from "~/components/views/SampleView/components/SampleViewMessage";
import { getConsensusGenomeData } from "~/components/views/SampleView/utils";
import { ReportFilters } from "./components/ReportFilters";
import { ReportStatsRow } from "./components/ReportStatsRow";
import { ReportTable } from "./components/ReportTable";
import { ReportViewSelector } from "./components/ReportViewSelector";
import { TaxonTreeVis } from "./components/TaxonTreeVis";
import cs from "./mngs_report.scss";
import { MngsReportProps } from "./types";

export const MngsReport = ({
  backgrounds,
  currentTab,
  clearAllFilters,
  enableMassNormalizedBackgrounds,
  filteredReportData,
  handleAnnotationUpdate,
  handleBlastClick,
  handleConsensusGenomeClick,
  handleCoverageVizClick,
  handlePreviousConsensusGenomeClick,
  handleOptionChanged,
  handleTaxonClick,
  handleViewClick,
  refreshDataFromOptionsChange,
  lineageData,
  loadingReport,
  ownedBackgrounds,
  otherBackgrounds,
  pipelineRun,
  project,
  reportData,
  reportMetadata,
  sample,
  selectedOptions,
  snapshotShareId,
  view,
}: MngsReportProps) => {
  const displayMergedNtNrValue = currentTab === WORKFLOW_TABS.MERGED_NT_NR;
  if (reportMetadata.reportReady && reportData?.length > 0 && !loadingReport) {
    return (
      <div className={cs.reportViewContainer}>
        <ReportFilters
          backgrounds={backgrounds}
          loadingReport={loadingReport}
          ownedBackgrounds={ownedBackgrounds}
          otherBackgrounds={otherBackgrounds}
          shouldDisableFilters={displayMergedNtNrValue}
          refreshDataFromOptionsChange={refreshDataFromOptionsChange}
          onFilterChanged={handleOptionChanged}
          sampleId={sample?.id}
          selected={selectedOptions}
          view={view}
          enableMassNormalizedBackgrounds={enableMassNormalizedBackgrounds}
          snapshotShareId={snapshotShareId}
          currentTab={currentTab}
        />
        <div className={cs.reportHeader}>
          <ReportStatsRow
            currentTab={currentTab}
            filteredReportData={filteredReportData}
            reportData={reportData}
            reportMetadata={reportMetadata}
            selectedOptions={selectedOptions}
            clearAllFilters={clearAllFilters}
          />
          <ReportViewSelector view={view} onViewClick={handleViewClick} />
        </div>
        {view === "table" && (
          <ReportTable
            consensusGenomeData={getConsensusGenomeData(sample)}
            currentTab={currentTab}
            data={filteredReportData}
            isAlignVizAvailable={!!reportMetadata?.alignVizAvailable}
            isConsensusGenomeEnabled={sample?.editable}
            isFastaDownloadEnabled={!!reportMetadata?.hasByteRanges}
            isPhyloTreeAllowed={sample ? sample.editable : false}
            onAnnotationUpdate={handleAnnotationUpdate}
            onBlastClick={handleBlastClick}
            onConsensusGenomeClick={handleConsensusGenomeClick}
            onCoverageVizClick={handleCoverageVizClick}
            onPreviousConsensusGenomeClick={handlePreviousConsensusGenomeClick}
            onTaxonNameClick={withAnalytics(
              handleTaxonClick,
              ANALYTICS_EVENT_NAMES.PIPELINE_SAMPLE_REPORT_TAXON_SIDEBAR_LINK_CLICKED,
            )}
            pipelineVersion={pipelineRun?.pipeline_version}
            pipelineRunId={pipelineRun?.id}
            projectId={project?.id}
            projectName={project?.name}
            sampleId={sample?.id}
            snapshotShareId={snapshotShareId}
            shouldDisplayMergedNtNrValue={displayMergedNtNrValue}
            shouldDisplayNoBackground={isNil(selectedOptions.background)}
          />
        )}
        {view === "tree" && filteredReportData.length > 0 && (
          <TaxonTreeVis
            lineage={lineageData}
            metric={
              currentTab === WORKFLOW_TABS.SHORT_READ_MNGS
                ? selectedOptions.metricShortReads
                : selectedOptions.metricLongReads
            }
            nameType={selectedOptions.nameType}
            onTaxonClick={handleTaxonClick}
            taxa={filteredReportData}
            currentTab={currentTab}
          />
        )}
      </div>
    );
  } else {
    // The report is either in progress, found 0 taxons, or encountered an error.
    return (
      <SampleViewMessage
        currentTab={currentTab}
        hasZeroTaxons={
          !loadingReport &&
          reportMetadata.reportReady &&
          reportData &&
          reportData?.length === 0
        }
        loadingReport={loadingReport}
        pipelineRun={pipelineRun}
        reportMetadata={reportMetadata}
        sample={sample}
        snapshotShareId={snapshotShareId}
      />
    );
  }
};
