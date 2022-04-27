import { get, isEmpty, size } from "lodash/fp";
import React, { useContext, useState } from "react";

import { deleteSample, saveVisualization } from "~/api";
import {
  ANALYTICS_EVENT_NAMES,
  withAnalytics,
  logAnalyticsEvent,
} from "~/api/analytics";
import BasicPopup from "~/components/BasicPopup";
import { UserContext } from "~/components/common/UserContext";
import ViewHeader from "~/components/layout/ViewHeader";
import {
  showAppcue,
  SAMPLE_VIEW_HEADER_MNGS_HELP_SIDEBAR,
  SAMPLE_VIEW_HEADER_CG_HELP_SIDEBAR,
} from "~/components/utils/appcues";

import { generateUrlToSampleView } from "~/components/utils/urls";
import { WORKFLOWS } from "~/components/utils/workflows";
import { getWorkflowRunZipLink } from "~/components/views/report/utils/download";
import { parseUrlParams } from "~/helpers/url";
import Project from "~/interface/project";
import ReportMetadata from "~/interface/reportMetaData";
import sample, { PipelineRuns } from "~/interface/sample";
import {
  DownloadButton,
  ErrorButton,
  HelpButton,
  SaveButton,
  ShareButton,
} from "~ui/controls/buttons";
import { openUrl } from "~utils/links";
import PipelineRunSampleViewControls from "./PipelineRunSampleViewControls";
import SampleDeletionConfirmationModal from "./SampleDeletionConfirmationModal";
import WorkflowVersionHeader from "./WorkflowVersionHeader";
import { PIPELINE_RUN_TABS } from "./constants";

import cs from "./sample_view_header.scss";

export default function SampleViewHeader({
  backgroundId,
  currentTab,
  deletable,
  editable,
  getDownloadReportTableWithAppliedFiltersLink,
  hasAppliedFilters,
  onDetailsClick,
  onPipelineVersionChange,
  currentRun,
  project,
  projectSamples,
  reportMetadata,
  sample,
  snapshotShareId,
  view,
  onShareClick,
}: SampleViewHeaderProps) {
  const [
    sampleDeletionConfirmationModalOpen,
    setSampleDeletionConfirmationModalOpen,
  ] = useState(false);

  const userContext = useContext(UserContext);
  const { allowedFeatures } = userContext || {};

  const workflow = PIPELINE_RUN_TABS.includes(currentTab)
    ? WORKFLOWS.SHORT_READ_MNGS.value
    : WORKFLOWS.CONSENSUS_GENOME.value;

  // Leaving in for now, removing in CH-118827
  const mngsWorkflow = workflow === WORKFLOWS.SHORT_READ_MNGS.value;

  const onSaveClick = async () => {
    if (view) {
      const params = parseUrlParams();
      params.sampleIds = sample.id;
      await saveVisualization(view, params);
    }
  };

  const renderShareButton = () => {
    return (
      <>
        <BasicPopup
          trigger={
            <ShareButton className={cs.controlElement} onClick={onShareClick} />
          }
          content="A shareable URL was copied to your clipboard!"
          on="click"
          hideOnScroll
        />
      </>
    );
  };

  const handleDeleteSample = async () => {
    await deleteSample(sample.id);
    location.href = `/home?project_id=${project.id}`;
    logAnalyticsEvent("SampleViewHeader_delete-sample-button_clicked", {
      sampleId: sample.id,
      sampleName: sample.name,
    });
  };

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
        isEmpty(sample.pipeline_runs) &&
        size(sample.workflow_runs) === 1);

    if (workflow === WORKFLOWS.CONSENSUS_GENOME.value) {
      const succeeded = get("status", currentRun) === "SUCCEEDED";
      return (
        <ViewHeader.Controls>
          <>
            {succeeded && (
              <>
                {renderShareButton()}
                <DownloadButton
                  className={cs.controlElement}
                  text="Download All"
                  onClick={() => {
                    openUrl(getWorkflowRunZipLink(currentRun.id));
                    logAnalyticsEvent(
                      "SampleViewHeader_consensus-genome-download-all-button_clicked",
                      {
                        sampleId: sample.id,
                      },
                    );
                  } }/>
              </>
            )}
            {!succeeded &&
            editable &&
            deletable &&
            isEmpty(sample.pipeline_runs) && ( // wouldn't want to delete mngs report
              <ErrorButton
                className={cs.controlElement}
                onClick={() => setSampleDeletionConfirmationModalOpen(true)}
                text="Delete Sample"
              />
            )}
            {shouldHideConsensusGenomeHelpButton ||
              renderConsensusGenomeHelpButton()}
          </>
        </ViewHeader.Controls>
      );
    } else {
      // This block is for short-read-mngs PipelineRun reports.
      return (
        <ViewHeader.Controls>
          {!isEmpty(reportMetadata) && renderShareButton()}
          {userContext.admin && (
            <SaveButton
              className={cs.controlElement}
              onClick={withAnalytics(
                onSaveClick,
                "SampleView_save-button_clicked",
                {
                  sampleId: sample && sample.id,
                },
              )}
            />
          )}
          <PipelineRunSampleViewControls
            className={cs.controlElement}
            backgroundId={backgroundId}
            currentTab={currentTab}
            deletable={deletable}
            editable={editable}
            getDownloadReportTableWithAppliedFiltersLink={
              getDownloadReportTableWithAppliedFiltersLink
            }
            onDeleteSample={() => setSampleDeletionConfirmationModalOpen(true)}
            hasAppliedFilters={hasAppliedFilters}
            pipelineRun={currentRun}
            project={project}
            reportMetadata={reportMetadata}
            sample={sample}
            view={view}
          />
          {!isEmpty(reportMetadata) && (
            <HelpButton
              className={cs.controlElement}
              onClick={showAppcue({
                flowId: SAMPLE_VIEW_HEADER_MNGS_HELP_SIDEBAR,
                analyticEventName:
                  ANALYTICS_EVENT_NAMES.SAMPLE_VIEW_HEADER_MNGS_HELP_BUTTON_CLICKED,
              })}
            />
          )}
        </ViewHeader.Controls>
      );
    }
  };

  const getBreadcrumbLink = () => {
    if (!project) return;
    return snapshotShareId
      ? `/pub/${snapshotShareId}`
      : `/home?project_id=${project.id}`;
  };

  const renderViewHeaderContent = () => (
    <ViewHeader.Content>
      <WorkflowVersionHeader
        sampleId={get("id", sample)}
        currentRun={currentRun}
        allRuns={
          mngsWorkflow
            ? get("pipeline_runs", sample)
            : get("workflow_runs", sample)
        }
        workflowType={workflow}
        mngsWorkflow={mngsWorkflow}
        versionKey={mngsWorkflow ? "pipeline_version" : "wdl_version"}
        timeKey={mngsWorkflow ? "created_at" : "executed_at"}
        onVersionChange={onPipelineVersionChange}
        snapshotShareId={snapshotShareId}
      />
      <ViewHeader.Pretitle breadcrumbLink={getBreadcrumbLink()}>
        {project ? project.name : ""}
      </ViewHeader.Pretitle>
      <ViewHeader.Title
        label={get("name", sample)}
        id={sample && sample.id}
        options={projectSamples.map(sample => ({
          label: sample.name,
          id: sample.id,
          onClick: () => {
            openUrl(
              generateUrlToSampleView({
                sampleId: sample.id,
                snapshotShareId,
              }),
            );
            logAnalyticsEvent("SampleView_header-title_clicked", {
              sampleId: sample.id,
            });
          },
        }))}
      />
      <div className={cs.sampleDetailsLinkContainer}>
        <span
          className={cs.sampleDetailsLink}
          onClick={withAnalytics(
            onDetailsClick,
            "SampleView_sample-details-link_clicked",
            {
              sampleId: sample && sample.id,
            },
          )}
        >
          Sample Details
        </span>
      </div>
    </ViewHeader.Content>
  );

  return (
    <>
      <ViewHeader className={cs.viewHeader}>
        {renderViewHeaderContent()}
        {!snapshotShareId && renderViewHeaderControls()}
      </ViewHeader>
      {sampleDeletionConfirmationModalOpen && (
        <SampleDeletionConfirmationModal
          open
          onCancel={() => setSampleDeletionConfirmationModalOpen(false)}
          onConfirm={handleDeleteSample}
        />
      )}
    </>
  );
}

SampleViewHeader.defaultProps = {
  deletable: false,
  projectSample: [],
  reportMetadata: {},
};

interface SampleViewHeaderProps {
  backgroundId?: number;
  currentRun: { id: number };
  currentTab: string;
  deletable: boolean;
  editable: boolean;
  getDownloadReportTableWithAppliedFiltersLink?: $TSFixMeFunction;
  hasAppliedFilters: boolean;
  onDetailsClick: $TSFixMeFunction;
  onPipelineVersionChange: $TSFixMeFunction;
  onShareClick: $TSFixMeFunction;
  pipelineRun: PipelineRuns;
  pipelineVersions?: string[];
  project: Project;
  projectSamples: {
    id: number;
    name: string;
  }[];
  reportMetadata: ReportMetadata;
  sample: sample;
  snapshotShareId?: $TSFixMe;
  view: string;
}
