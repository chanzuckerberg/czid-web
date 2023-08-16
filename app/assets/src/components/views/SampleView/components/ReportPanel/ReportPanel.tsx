import React from "react";
import DeprecatedAmrView from "~/components/DeprecatedAmrView";
import { TABS } from "~/components/views/SampleView/utils";
import { WorkflowRun } from "~/interface/sample";
import { PipelineRun } from "~/interface/shared";
import { AmrView } from "../AmrView";
import { ConsensusGenomeView } from "../ConsensusGenomeView";
import { MngsReport } from "../MngsReport";
import { ReportPanelProps } from "./types";

export const ReportPanel = ({
  amrDeprecatedData,
  backgrounds,
  currentRun,
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
  handleWorkflowRunSelect,
  refreshDataFromOptionsChange,
  lineageData,
  loadingReport,
  loadingWorkflowRunResults,
  ownedBackgrounds,
  otherBackgrounds,
  project,
  reportData,
  reportMetadata,
  sample,
  selectedOptions,
  snapshotShareId,
  view,
  workflowRunResults,
}: ReportPanelProps) => {
  return (
    <>
      {(currentTab === TABS.SHORT_READ_MNGS ||
        currentTab === TABS.LONG_READ_MNGS ||
        currentTab === TABS.MERGED_NT_NR) && (
        <MngsReport
          backgrounds={backgrounds}
          currentTab={currentTab}
          clearAllFilters={clearAllFilters}
          enableMassNormalizedBackgrounds={enableMassNormalizedBackgrounds}
          filteredReportData={filteredReportData}
          handleAnnotationUpdate={handleAnnotationUpdate}
          handleBlastClick={handleBlastClick}
          handleConsensusGenomeClick={handleConsensusGenomeClick}
          handleCoverageVizClick={handleCoverageVizClick}
          handlePreviousConsensusGenomeClick={
            handlePreviousConsensusGenomeClick
          }
          handleOptionChanged={handleOptionChanged}
          handleTaxonClick={handleTaxonClick}
          handleViewClick={handleViewClick}
          refreshDataFromOptionsChange={refreshDataFromOptionsChange}
          lineageData={lineageData}
          loadingReport={loadingReport}
          ownedBackgrounds={ownedBackgrounds}
          otherBackgrounds={otherBackgrounds}
          pipelineRun={currentRun as PipelineRun}
          project={project}
          reportData={reportData}
          reportMetadata={reportMetadata}
          sample={sample}
          selectedOptions={selectedOptions}
          snapshotShareId={snapshotShareId}
          view={view}
        />
      )}
      {currentTab === TABS.AMR_DEPRECATED && amrDeprecatedData && (
        <DeprecatedAmrView amr={amrDeprecatedData} />
      )}
      {currentTab === TABS.AMR && sample && (
        <AmrView sample={sample} workflowRun={currentRun as WorkflowRun} />
      )}
      {currentTab === TABS.CONSENSUS_GENOME && sample && (
        <ConsensusGenomeView
          onWorkflowRunSelect={handleWorkflowRunSelect}
          sample={sample}
          loadingResults={loadingWorkflowRunResults}
          workflowRun={currentRun as WorkflowRun}
          workflowRunResults={workflowRunResults}
        />
      )}
    </>
  );
};
