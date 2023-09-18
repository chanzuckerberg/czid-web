import { get, isEmpty, size } from "lodash/fp";
import React, { useContext } from "react";
import { saveVisualization } from "~/api";
import {
  ANALYTICS_EVENT_NAMES,
  trackEvent,
  withAnalytics,
} from "~/api/analytics";
import { UserContext } from "~/components/common/UserContext";
import {
  SAMPLE_VIEW_HEADER_AMR_HELP_SIDEBAR,
  SAMPLE_VIEW_HEADER_CG_HELP_SIDEBAR,
  SAMPLE_VIEW_HEADER_MNGS_HELP_SIDEBAR,
  showAppcue,
} from "~/components/utils/appcues";
import {
  isMngsWorkflow,
  WorkflowType,
  WORKFLOW_TABS,
} from "~/components/utils/workflows";
import { getWorkflowRunZipLink } from "~/components/views/report/utils/download";
import {
  FINALIZED_SAMPLE_UPLOAD_ERRORS,
  SampleUploadErrors,
} from "~/components/views/samples/constants";
import { parseUrlParams } from "~/helpers/url";
import ReportMetadata from "~/interface/reportMetaData";
import Sample, { WorkflowRun } from "~/interface/sample";
import { CurrentTabSample } from "~/interface/sampleView";
import { PipelineRun } from "~/interface/shared";
import { DownloadButton, HelpButton, SaveButton } from "~ui/controls/buttons";
import { openUrl } from "~utils/links";
import { AmrDownloadDropdown } from "./components/AmrDownloadDropdown";
import { BenchmarkDownloadDropdown } from "./components/BenchmarkDownloadDropdown";
import { MngsDownloadDropdown } from "./components/MngsDownloadDropdown";
import { OverflowMenu } from "./components/OverflowMenu";
import { ShareButtonPopUp } from "./components/ShareButtonPopUp";
import cs from "./primary_header_controls.scss";

interface PrimaryHeaderControlsProps {
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
  reportMetadata,
  sample,
  view,
  workflow,
  onDeleteRunSuccess,
}: PrimaryHeaderControlsProps) => {
  const {
    allowedFeatures,
    admin: userIsAdmin,
    userId,
  } = useContext(UserContext) || {};

  // We can't delete samples if they are pipeline runs with no metadata
  let currentRunLoaded = !!currentRun;
  if (isMngsWorkflow(workflow)) {
    currentRunLoaded = !isEmpty(reportMetadata);
  }

  /* For mNGS pipelineRuns, we can't download or share samples
  if the report metadata is null (captured by `currentRunLoaded`).

  For CG or AMR workflowRuns, we can't download or share samples
  that didn't succeed.
  */
  let readyToDownload = currentRunLoaded;
  if (!isMngsWorkflow(workflow)) {
    readyToDownload = get("status", currentRun) === "SUCCEEDED";
  }

  const onDownloadAll = (eventName: "amr" | "consensus-genome") => {
    openUrl(getWorkflowRunZipLink(currentRun.id));
    trackEvent(`SampleViewHeader_${eventName}-download-all-button_clicked`, {
      sampleId: sample?.id,
    });
  };

  const onSaveClick = async () => {
    if (view) {
      const params = parseUrlParams();
      params.sampleIds = sample?.id;
      await saveVisualization(view, params);
    }
  };

  const renderDownloadAll = (workflow: "amr" | "consensus-genome") => {
    return (
      readyToDownload && (
        <DownloadButton
          className={cs.controlElement}
          text="Download All"
          onClick={() => onDownloadAll(workflow)}
          primary={workflow === WorkflowType.AMR}
        />
      )
    );
  };

  const renderDownloadButton = () => {
    if (!readyToDownload) {
      return;
    }
    switch (workflow) {
      case WorkflowType.LONG_READ_MNGS:
      case WorkflowType.SHORT_READ_MNGS:
        return renderDownloadDropdown();
        break;
      case WorkflowType.CONSENSUS_GENOME:
        return renderDownloadAll(workflow);
        break;
      case WorkflowType.AMR:
        return renderDownloadDropdown();
      case WorkflowType.BENCHMARK:
        return (
          <BenchmarkDownloadDropdown
            className={cs.controlElement}
            workflowRun={currentRun as WorkflowRun}
          />
        );
        break;
    }
  };

  const renderDownloadDropdown = () => {
    switch (workflow) {
      case WorkflowType.LONG_READ_MNGS:
      case WorkflowType.SHORT_READ_MNGS: {
        return (
          <MngsDownloadDropdown
            className={cs.controlElement}
            backgroundId={backgroundId}
            currentTab={currentTab}
            getDownloadReportTableWithAppliedFiltersLink={
              getDownloadReportTableWithAppliedFiltersLink
            }
            hasAppliedFilters={hasAppliedFilters}
            pipelineRun={currentRun as PipelineRun}
            sample={sample}
            view={view}
          />
        );
      }

      case WorkflowType.AMR: {
        return (
          <AmrDownloadDropdown
            className={cs.controlElement}
            backgroundId={backgroundId}
            currentTab={currentTab}
            workflowRun={currentRun as WorkflowRun}
            sample={sample}
          />
        );
      }
    }
  };

  const renderHelpButton = () => {
    // CG help button should only be shown if feature flag is on
    // unless the sample has 0 mNGS runs & exactly 1 CG run.
    const shouldHideConsensusGenomeHelpButton =
      !allowedFeatures.includes("cg_appcues_help_button") ||
      (sample &&
        isEmpty(sample?.pipeline_runs) &&
        size(sample?.workflow_runs) === 1);

    // Show help button only for SHORT_READ_MNGS and AMR workflows or when shouldHideConsensusGenomeHelpButton is false
    if (
      workflow === WorkflowType.LONG_READ_MNGS ||
      currentTab === WORKFLOW_TABS.AMR_DEPRECATED ||
      (workflow === WorkflowType.CONSENSUS_GENOME &&
        shouldHideConsensusGenomeHelpButton)
    ) {
      return;
    }

    // format appCueFlowId and anaylticsEventName based on workflow
    const appCueFlowId = {
      [WorkflowType.SHORT_READ_MNGS]: SAMPLE_VIEW_HEADER_MNGS_HELP_SIDEBAR,
      [WorkflowType.CONSENSUS_GENOME]: SAMPLE_VIEW_HEADER_CG_HELP_SIDEBAR,
      [WorkflowType.AMR]: SAMPLE_VIEW_HEADER_AMR_HELP_SIDEBAR,
    };

    const anaylticsEventName = {
      [WorkflowType.SHORT_READ_MNGS]:
        ANALYTICS_EVENT_NAMES.SAMPLE_VIEW_HEADER_MNGS_HELP_BUTTON_CLICKED,
      [WorkflowType.CONSENSUS_GENOME]:
        ANALYTICS_EVENT_NAMES.SAMPLE_VIEW_HEADER_CONSENSUS_GENOME_HELP_BUTTON_CLICKED,
      [WorkflowType.AMR]:
        ANALYTICS_EVENT_NAMES.SAMPLE_VIEW_HEADER_AMR_HELP_BUTTON_CLICKED,
    };

    return (
      <HelpButton
        className={cs.controlElement}
        onClick={showAppcue({
          flowId: appCueFlowId[workflow],
          analyticEventName: anaylticsEventName[workflow],
        })}
      />
    );
  };

  const renderSaveButton = () => {
    switch (workflow) {
      case WorkflowType.LONG_READ_MNGS:
      case WorkflowType.SHORT_READ_MNGS:
        return (
          userIsAdmin && (
            <SaveButton
              className={cs.controlElement}
              onClick={withAnalytics(
                onSaveClick,
                ANALYTICS_EVENT_NAMES.SAMPLE_VIEW_SAVE_BUTTON_CLICKED,
                {
                  sampleId: sample?.id,
                },
              )}
            />
          )
        );
      default:
        return null;
    }
  };

  const renderOverflowMenu = () => {
    const redirectOnSuccess =
      sample && [...sample.pipeline_runs, ...sample.workflow_runs].length === 1;
    const readyToDelete = currentRunLoaded || sample?.upload_error;
    return (
      readyToDelete &&
      currentTab !== WORKFLOW_TABS.AMR_DEPRECATED && (
        <OverflowMenu
          className={cs.controlElement}
          workflow={workflow}
          deleteId={isMngsWorkflow(workflow) ? sample?.id : currentRun?.id}
          onDeleteRunSuccess={onDeleteRunSuccess}
          runFinalized={
            currentRun?.run_finalized ||
            FINALIZED_SAMPLE_UPLOAD_ERRORS.includes(
              sample?.upload_error as SampleUploadErrors,
            )
          }
          userOwnsRun={userId === sample?.user_id}
          redirectOnSuccess={redirectOnSuccess}
        />
      )
    );
  };

  return (
    <>
      <div className={cs.controlsBottomRowContainer}>
        <ShareButtonPopUp onShareClick={onShareClick} />
        {renderSaveButton()}
        {renderDownloadButton()}
        {renderHelpButton()}
        {renderOverflowMenu()}
      </div>
    </>
  );
};
