import React from "react";
import { WorkflowType } from "~/components/utils/workflows";
import { ReportMetadata } from "~/interface/reportMetaData";
import Sample, { WorkflowRun } from "~/interface/sample";
import { CurrentTabSample } from "~/interface/sampleView";
import { PipelineRun } from "~/interface/shared";
import { SampleViewDownloadButtonConfig } from "./workflowTypeConfig";

interface SampleViewDownloadButtonProps {
  workflow: WorkflowType;
  className: string;
  sample: Sample;
  currentRun: WorkflowRun | PipelineRun;
  view: string;
  hasAppliedFilters: boolean;
  getDownloadReportTableWithAppliedFiltersLink: () => string;
  reportMetadata: ReportMetadata;
  backgroundId: number | null;
  currentTab: CurrentTabSample;
}

export const SampleViewDownloadButton = ({
  workflow,
  className,
  sample,
  currentRun,
  view,
  hasAppliedFilters,
  getDownloadReportTableWithAppliedFiltersLink,
  reportMetadata,
  backgroundId,
  currentTab,
}: SampleViewDownloadButtonProps) => {
  const { component: DownloadButtonByWorkflow, readyToDownload } =
    SampleViewDownloadButtonConfig[workflow]({
      currentRun,
      reportMetadata,
      currentTab,
    });
  return (
    <DownloadButtonByWorkflow
      readyToDownload={readyToDownload}
      className={className}
      workflowRun={currentRun as WorkflowRun}
      workflowType={workflow}
      sample={sample}
      backgroundId={backgroundId}
      getDownloadReportTableWithAppliedFiltersLink={
        getDownloadReportTableWithAppliedFiltersLink
      }
      hasAppliedFilters={hasAppliedFilters}
      pipelineRun={currentRun as PipelineRun}
      view={view}
    />
  );
};
