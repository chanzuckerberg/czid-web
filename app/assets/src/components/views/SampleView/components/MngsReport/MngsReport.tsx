import { isNil } from "lodash";
import React from "react";
import { ANALYTICS_EVENT_NAMES, useWithAnalytics } from "~/api/analytics";
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
  dispatchSelectedOptions,
  enableMassNormalizedBackgrounds,
  filteredReportData,
  handleAnnotationUpdate,
  handleBlastClick,
  handleConsensusGenomeClick,
  handleCoverageVizClick,
  handlePreviousConsensusGenomeClick,
  handleTaxonClick,
  handleViewClick,
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
  const withAnalytics = useWithAnalytics();
  if (
    reportMetadata.reportReady &&
    reportData?.length > 0 &&
    !loadingReport &&
    sample
  ) {
    return (
      <div className={cs.reportViewContainer}>
        <ReportFilters
          backgrounds={backgrounds}
          dispatchSelectedOptions={dispatchSelectedOptions}
          loadingReport={loadingReport}
          ownedBackgrounds={ownedBackgrounds}
          otherBackgrounds={otherBackgrounds}
          sampleId={sample?.id}
          projectId={project?.id}
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
            pipelineRun={pipelineRun}
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
            isConsensusGenomeEnabled={sample?.editable}
            isFastaDownloadEnabled={!!reportMetadata?.hasByteRanges}
            isPhyloTreeAllowed={sample ? sample.editable : false}
            onAnnotationUpdate={handleAnnotationUpdate}
            onBlastClick={handleBlastClick}
            onConsensusGenomeClick={params =>
              handleConsensusGenomeClick(params, sample)
            }
            onCoverageVizClick={handleCoverageVizClick}
            onPreviousConsensusGenomeClick={params =>
              handlePreviousConsensusGenomeClick(params, sample)
            }
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
