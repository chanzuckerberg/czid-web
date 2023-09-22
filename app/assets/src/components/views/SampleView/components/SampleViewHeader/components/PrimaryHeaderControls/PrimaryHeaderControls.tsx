import React from "react";
import { WorkflowType } from "~/components/utils/workflows";
import ReportMetadata from "~/interface/reportMetaData";
import Sample, { WorkflowRun } from "~/interface/sample";
import { CurrentTabSample } from "~/interface/sampleView";
import { PipelineRun } from "~/interface/shared";
import { SampleViewDownloadButton } from "./components/SampleViewDownloadButton";
import { SampleViewHelpButton } from "./components/SampleViewHelpButton";
import { SampleViewOverflowMenu } from "./components/SampleViewOverflowMenu";
import { SampleViewSaveButton } from "./components/SampleViewSaveButton";
import { ShareButtonPopUp } from "./components/ShareButtonPopUp";
import cs from "./primary_header_controls.scss";
export interface PrimaryHeaderControlsProps {
  backgroundId?: number;
  currentRun: WorkflowRun | PipelineRun;
  currentTab: CurrentTabSample;
  getDownloadReportTableWithAppliedFiltersLink?: () => string;
  hasAppliedFilters: boolean;
  onShareClick: () => void;
  onDeleteRunSuccess: () => void;
  reportMetadata: ReportMetadata;
  sample: Sample;
  view: string;
  workflow: WorkflowType;
}

export const PrimaryHeaderControls = ({
  backgroundId,
  currentRun,
  currentTab,
  getDownloadReportTableWithAppliedFiltersLink,
  hasAppliedFilters,
  onShareClick,
  onDeleteRunSuccess,
  reportMetadata,
  sample,
  view,
  workflow,
}: PrimaryHeaderControlsProps): JSX.Element => {
  return (
    <div className={cs.controlsBottomRowContainer}>
      <ShareButtonPopUp onShareClick={onShareClick} />
      <SampleViewSaveButton
        className={cs.controlElement}
        sampleId={sample?.id}
        view={view}
        workflow={workflow}
      />
      <SampleViewDownloadButton
        backgroundId={backgroundId}
        className={cs.controlElement}
        currentRun={currentRun}
        currentTab={currentTab}
        getDownloadReportTableWithAppliedFiltersLink={
          getDownloadReportTableWithAppliedFiltersLink
        }
        hasAppliedFilters={hasAppliedFilters}
        reportMetadata={reportMetadata}
        sample={sample}
        view={view}
        workflow={workflow}
      />
      <SampleViewHelpButton
        className={cs.controlElement}
        sample={sample}
        workflow={workflow}
      />
      <SampleViewOverflowMenu
        className={cs.controlElement}
        currentRun={currentRun}
        currentTab={currentTab}
        onDeleteRunSuccess={onDeleteRunSuccess}
        reportMetadata={reportMetadata}
        sample={sample}
        workflow={workflow}
      />
    </div>
  );
};
