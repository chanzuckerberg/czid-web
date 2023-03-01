import { Button, Icon } from "czifui";
import { get, isEmpty, size } from "lodash/fp";
import React, { useContext } from "react";
import { saveVisualization } from "~/api";
import {
  ANALYTICS_EVENT_NAMES,
  withAnalytics,
  trackEvent,
} from "~/api/analytics";

import { UserContext } from "~/components/common/UserContext";

import {
  showAppcue,
  SAMPLE_VIEW_HEADER_MNGS_HELP_SIDEBAR,
  SAMPLE_VIEW_HEADER_CG_HELP_SIDEBAR,
} from "~/components/utils/appcues";

import { WORKFLOWS, findInWorkflows } from "~/components/utils/workflows";
import { getWorkflowRunZipLink } from "~/components/views/report/utils/download";
import { parseUrlParams } from "~/helpers/url";
import ReportMetadata from "~/interface/reportMetaData";
import Sample, { WorkflowRun } from "~/interface/sample";
import { CurrentTabSample } from "~/interface/sampleView";
import { PipelineRun } from "~/interface/shared";
import {
  DownloadButton,
  ErrorButton,
  HelpButton,
  SaveButton,
} from "~ui/controls/buttons";
import { openUrl } from "~utils/links";
import PipelineVersionSelect from "../../../components/PipelineVersionSelect";
import { PipelineRunSampleViewControls } from "./PipelineRunSampleViewControls";
import { ShareButtonPopUp } from "./ShareButtonPopUp";

import cs from "./sample_view_header_controls.scss";

interface SampleViewHeaderControlsProps {
  backgroundId?: number;
  currentRun: WorkflowRun | PipelineRun;
  currentTab: CurrentTabSample;
  deletable: boolean;
  editable: boolean;
  getDownloadReportTableWithAppliedFiltersLink?: () => string;
  hasAppliedFilters: boolean;
  onDeleteSample: () => void;
  onDetailsClick: () => void;
  onPipelineVersionChange: (newPipelineVersion: string) => void;
  onShareClick: () => void;
  pipelineVersions?: string[];
  reportMetadata: ReportMetadata;
  sample: Sample;
  snapshotShareId?: string;
  view: string;
}

export const SampleViewHeaderControls = ({
  backgroundId,
  currentRun,
  currentTab,
  deletable,
  editable,
  getDownloadReportTableWithAppliedFiltersLink,
  hasAppliedFilters,
  onDeleteSample,
  onDetailsClick,
  onPipelineVersionChange,
  onShareClick,
  reportMetadata,
  sample,
  view,
}: SampleViewHeaderControlsProps) => {
  const userContext = useContext(UserContext);
  const { allowedFeatures, admin: userIsAdmin } = userContext || {};

  const onSaveClick = async () => {
    if (view) {
      const params = parseUrlParams();
      params.sampleIds = sample?.id;
      await saveVisualization(view, params);
    }
  };

  const workflow =
    WORKFLOWS[findInWorkflows(currentTab, "label")]?.value ||
    WORKFLOWS.SHORT_READ_MNGS.value;

  const mngsWorkflow = [
    WORKFLOWS.SHORT_READ_MNGS.value,
    WORKFLOWS.LONG_READ_MNGS.value,
  ].includes(workflow);

  const getAllRuns = () => {
    const runsByType =
      get("workflow_runs", sample) &&
      get("workflow_runs", sample).filter(run => run.workflow === workflow);
    return mngsWorkflow ? get("pipeline_runs", sample) : runsByType;
  };

  const renderSampleViewControlsTopRow = () => {
    return (
      <div className={cs.controlsTopRowContainer}>
        <PipelineVersionSelect
          sampleId={get("id", sample)}
          shouldIncludeDatabaseVersion={false}
          currentRun={currentRun}
          allRuns={getAllRuns()}
          workflowType={workflow}
          versionKey={mngsWorkflow ? "pipeline_version" : "wdl_version"}
          timeKey={mngsWorkflow ? "created_at" : "executed_at"}
          onVersionChange={onPipelineVersionChange}
        />
        {userIsAdmin && workflow !== WORKFLOWS.CONSENSUS_GENOME.value && (
          <>
            <Button
              className={cs.controlElement}
              sdsType="primary"
              sdsStyle="minimal"
              isAllCaps={true}
              onClick={() =>
                (location.href = `/samples/${sample?.id}/pipeline_runs`)
              }
            >
              Pipeline Runs
            </Button>
            <span className={cs.seperator}> | </span>
          </>
        )}
        <Button
          sdsType="primary"
          sdsStyle="minimal"
          isAllCaps={true}
          onClick={withAnalytics(
            onDetailsClick,
            "SampleView_sample-details-link_clicked",
            {
              sampleId: sample?.id,
            },
          )}
        >
          Sample Details
        </Button>
      </div>
    );
  };

  const renderPipelineRunSampleViewControls = () => (
    <PipelineRunSampleViewControls
      className={cs.controlElement}
      backgroundId={backgroundId}
      currentTab={currentTab}
      deletable={deletable}
      editable={editable}
      getDownloadReportTableWithAppliedFiltersLink={
        getDownloadReportTableWithAppliedFiltersLink
      }
      onDeleteSample={onDeleteSample}
      hasAppliedFilters={hasAppliedFilters}
      pipelineRun={currentRun as PipelineRun}
      reportMetadata={reportMetadata}
      sample={sample}
      view={view}
    />
  );

  const renderShortReadMngsHelpButton = () => (
    <HelpButton
      className={cs.controlElement}
      onClick={showAppcue({
        flowId: SAMPLE_VIEW_HEADER_MNGS_HELP_SIDEBAR,
        analyticEventName:
          ANALYTICS_EVENT_NAMES.SAMPLE_VIEW_HEADER_MNGS_HELP_BUTTON_CLICKED,
      })}
    />
  );

  const renderConsensusGenomeHelpButton = () => (
    <HelpButton
      className={cs.controlElement}
      onClick={showAppcue({
        flowId: SAMPLE_VIEW_HEADER_CG_HELP_SIDEBAR,
        analyticEventName:
          ANALYTICS_EVENT_NAMES.SAMPLE_VIEW_HEADER_CONSENSUS_GENOME_HELP_BUTTON_CLICKED,
      })}
    />
  );

  const renderViewHeaderControls = () => {
    // Should hide CG appcues help button if a sample doesn't have the feature flag or (has 0 mNGS runs & 1 CG run)
    const shouldHideConsensusGenomeHelpButton =
      !allowedFeatures.includes("cg_appcues_help_button") ||
      (sample &&
        isEmpty(sample?.pipeline_runs) &&
        size(sample?.workflow_runs) === 1);

    if (workflow === WORKFLOWS.CONSENSUS_GENOME.value) {
      const succeeded = get("status", currentRun) === "SUCCEEDED";
      return (
        <>
          {renderSampleViewControlsTopRow()}
          <div className={cs.controlsBottomRowContainer}>
            {succeeded && (
              <>
                <ShareButtonPopUp onShareClick={onShareClick} />
                <DownloadButton
                  className={cs.controlElement}
                  text="Download All"
                  onClick={() => {
                    openUrl(getWorkflowRunZipLink(currentRun.id));
                    trackEvent(
                      "SampleViewHeader_consensus-genome-download-all-button_clicked",
                      {
                        sampleId: sample?.id,
                      },
                    );
                  }}
                />
              </>
            )}
            {!succeeded &&
            editable &&
            deletable &&
            isEmpty(sample?.pipeline_runs) && ( // wouldn't want to delete mngs report
                <ErrorButton
                  className={cs.controlElement}
                  onClick={onDeleteSample}
                  text="Delete Sample"
                />
              )}
            {shouldHideConsensusGenomeHelpButton ||
              renderConsensusGenomeHelpButton()}
          </div>
        </>
      );
    } else if (workflow === WORKFLOWS.AMR.value) {
      // This block is for amr PipelineRun reports.
      const succeeded = get("status", currentRun) === "SUCCEEDED";
      return (
        <>
          {renderSampleViewControlsTopRow()}
          <div className={cs.controlsBottomRowContainer}>
            {succeeded && (
              <Button
                className={cs.controlElement}
                onClick={() => {
                  openUrl(getWorkflowRunZipLink(currentRun.id));
                  trackEvent(
                    "SampleViewHeader_amr-download-all-button_clicked",
                    {
                      sampleId: sample?.id,
                    },
                  );
                }}
                sdsStyle="rounded"
                sdsType="primary"
                startIcon={
                  <Icon sdsIcon="download" sdsSize="xl" sdsType="button" />
                }
              >
                Download All
              </Button>
            )}
          </div>
        </>
      );
    } else if (workflow === WORKFLOWS.LONG_READ_MNGS.value) {
      // This block is for long-read-mngs PipelineRun reports.
      return (
        <>
          {renderSampleViewControlsTopRow()}
          <div className={cs.controlsBottomRowContainer}>
            {!isEmpty(reportMetadata) && (
              <ShareButtonPopUp onShareClick={onShareClick} />
            )}
            {userContext.admin && (
              <SaveButton
                className={cs.controlElement}
                onClick={withAnalytics(
                  onSaveClick,
                  "SampleView_save-button_clicked",
                  {
                    sampleId: sample && sample?.id,
                  },
                )}
              />
            )}
            {renderPipelineRunSampleViewControls()}
          </div>
        </>
      );
    } else {
      // This block is for short-read-mngs PipelineRun reports.
      return (
        <>
          {renderSampleViewControlsTopRow()}
          <div className={cs.controlsBottomRowContainer}>
            {!isEmpty(reportMetadata) && (
              <ShareButtonPopUp onShareClick={onShareClick} />
            )}
            {userContext.admin && (
              <SaveButton
                className={cs.controlElement}
                onClick={withAnalytics(
                  onSaveClick,
                  "SampleView_save-button_clicked",
                  {
                    sampleId: sample && sample?.id,
                  },
                )}
              />
            )}
            {renderPipelineRunSampleViewControls()}
            {!isEmpty(reportMetadata) && renderShortReadMngsHelpButton()}
          </div>
        </>
      );
    }
  };

  return <>{renderViewHeaderControls()}</>;
};
