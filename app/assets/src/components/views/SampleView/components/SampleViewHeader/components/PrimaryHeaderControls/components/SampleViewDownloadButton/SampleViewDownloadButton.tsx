import React from "react";
import { trackEvent } from "~/api/analytics";
import { openUrl } from "~/components/utils/links";
import { WorkflowType } from "~/components/utils/workflows";
import { getWorkflowRunZipLink } from "~/components/views/report/utils/download";
import ReportMetadata from "~/interface/reportMetaData";
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
  backgroundId: number;
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
  const onDownloadAll = (eventName: WorkflowType) => {
    openUrl(getWorkflowRunZipLink(currentRun?.id));
    trackEvent(`SampleViewHeader_${eventName}-download-all-button_clicked`, {
      sampleId: sample?.id,
    });
  };
  const {
    component: DownloadButtonByWorkflow,
    readyToDownload,
    disableDownloadCSV,
  } = SampleViewDownloadButtonConfig[workflow]({
    currentRun,
    reportMetadata,
    currentTab,
  });
  return (
    <DownloadButtonByWorkflow
      readyToDownload={readyToDownload}
      className={className}
      workflowRun={currentRun as WorkflowRun}
      sample={sample}
      handleDownloadAllClick={() => onDownloadAll(workflow)}
      backgroundId={backgroundId}
      disableDownloadCSV={disableDownloadCSV}
      getDownloadReportTableWithAppliedFiltersLink={
        getDownloadReportTableWithAppliedFiltersLink
      }
      hasAppliedFilters={hasAppliedFilters}
      pipelineRun={currentRun as PipelineRun}
      view={view}
    />
  );
};
