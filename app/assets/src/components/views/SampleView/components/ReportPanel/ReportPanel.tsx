import React from "react";
import DeprecatedAmrView from "~/components/DeprecatedAmrView";
import { WORKFLOW_TABS } from "~/components/utils/workflows";
import { WorkflowRun } from "~/interface/sample";
import { PipelineRun } from "~/interface/shared";
import { AmrView } from "../AmrView";
import { BenchmarkView } from "../BenchmarkView";
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
  refreshDataFromOptionsChange,
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
  lineageData,
  loadingReport,
  ownedBackgrounds,
  otherBackgrounds,
  project,
  reportData,
  reportMetadata,
  sample,
  selectedOptions,
  snapshotShareId,
  view,
}: ReportPanelProps) => {
  return (
    <>
      {(currentTab === WORKFLOW_TABS.SHORT_READ_MNGS ||
        currentTab === WORKFLOW_TABS.LONG_READ_MNGS) && (
        <MngsReport
          backgrounds={backgrounds}
          currentTab={currentTab}
          clearAllFilters={clearAllFilters}
          refreshDataFromOptionsChange={refreshDataFromOptionsChange}
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
      {currentTab === WORKFLOW_TABS.AMR_DEPRECATED && amrDeprecatedData && (
        <DeprecatedAmrView amr={amrDeprecatedData} />
      )}
      {currentTab === WORKFLOW_TABS.AMR && sample && (
        <AmrView sample={sample} workflowRun={currentRun as WorkflowRun} />
      )}
      {currentTab === WORKFLOW_TABS.BENCHMARK && sample && (
        <BenchmarkView
          sample={sample}
          workflowRun={currentRun as WorkflowRun}
        />
      )}
      {currentTab === WORKFLOW_TABS.CONSENSUS_GENOME && sample && (
        <ConsensusGenomeView
          onWorkflowRunSelect={handleWorkflowRunSelect}
          sample={sample}
          workflowRun={currentRun as WorkflowRun}
        />
      )}
    </>
  );
};
