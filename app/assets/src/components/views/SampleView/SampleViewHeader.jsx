import React, { useContext } from "react";
import { get, isEmpty, size } from "lodash/fp";

import { deleteSample, saveVisualization } from "~/api";
import {
  ANALYTICS_EVENT_NAMES,
  withAnalytics,
  logAnalyticsEvent,
} from "~/api/analytics";
import BasicPopup from "~/components/BasicPopup";
import { UserContext } from "~/components/common/UserContext";
import ViewHeader from "~/components/layout/ViewHeader";
import PropTypes from "~/components/utils/propTypes";
import { WORKFLOWS } from "~/components/utils/workflows";
import { getWorkflowRunZipLink } from "~/components/views/report/utils/download";
import { copyShortUrlToClipboard, parseUrlParams } from "~/helpers/url";
import {
  DownloadButton,
  HelpButton,
  PrimaryButton,
  SaveButton,
  ShareButton,
} from "~ui/controls/buttons";
import { SAMPLE_VIEW_HEADER_MNGS_HELP_SIDEBAR } from "~/components/utils/appcues";
import { openUrl } from "~utils/links";
import { generateUrlToSampleView } from "~/components/utils/urls";
import { PIPELINE_RUN_TABS } from "./constants";

import PipelineRunSampleViewControls from "./PipelineRunSampleViewControls";
import WorkflowVersionHeader from "./WorkflowVersionHeader";
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
}) {
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
      params.sampleIds = [sample.id];
      await saveVisualization(view, params);
    }
  };

  const renderShareButton = () => {
    return (
      <>
        <BasicPopup
          trigger={
            <ShareButton
              className={cs.controlElement}
              onClick={() => {
                copyShortUrlToClipboard();
                logAnalyticsEvent("SampleView_share-button_clicked", {
                  sampleId: sample && sample.id,
                });
              }}
            />
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
      onClick={withAnalytics(
        () =>
          /*
          TODO: Uncomment & insert CG appcue flow ID when it's ready (CH-118852)
          window.Appcues &&
          window.Appcues.show(INSERT_CG_HELP_BUTTON_APPCUE_FLOW_ID_HERE)
        */
          // eslint-disable-next-line no-console
          console.log(
            ANALYTICS_EVENT_NAMES.SAMPLE_VIEW_HEADER_CONSENSUS_GENOME_HELP_BUTTON_CLICKED
          ),
        ANALYTICS_EVENT_NAMES.SAMPLE_VIEW_HEADER_CONSENSUS_GENOME_HELP_BUTTON_CLICKED
      )}
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
                      }
                    );
                  }}
                />
              </>
            )}
            {!succeeded &&
            editable &&
            deletable &&
            isEmpty(sample.pipeline_runs) && ( // wouldn't want to delete mngs report
                <PrimaryButton
                  className={cs.controlElement}
                  onClick={handleDeleteSample}
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
                }
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
            onDeleteSample={handleDeleteSample}
            hasAppliedFilters={hasAppliedFilters}
            pipelineRun={currentRun}
            project={project}
            reportMetadata={reportMetadata}
            sample={sample}
            view={view}
          />
          {!isEmpty(reportMetadata) && allowedFeatures.includes("appcues") && (
            <HelpButton
              className={cs.controlElement}
              onClick={withAnalytics(
                () =>
                  window.Appcues &&
                  window.Appcues.show(SAMPLE_VIEW_HEADER_MNGS_HELP_SIDEBAR),
                "SampleViewHeader_help-button_clicked"
              )}
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
              })
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
            }
          )}
        >
          Sample Details
        </span>
      </div>
    </ViewHeader.Content>
  );

  return (
    <ViewHeader className={cs.viewHeader}>
      {renderViewHeaderContent()}
      {!snapshotShareId && renderViewHeaderControls()}
    </ViewHeader>
  );
}

SampleViewHeader.defaultProps = {
  deletable: false,
  projectSample: [],
  reportMetadata: {},
};

SampleViewHeader.propTypes = {
  backgroundId: PropTypes.number,
  currentTab: PropTypes.string,
  deletable: PropTypes.bool,
  editable: PropTypes.bool.isRequired,
  getDownloadReportTableWithAppliedFiltersLink: PropTypes.func,
  hasAppliedFilters: PropTypes.bool.isRequired,
  onDetailsClick: PropTypes.func.isRequired,
  onPipelineVersionChange: PropTypes.func.isRequired,
  pipelineRun: PropTypes.PipelineRun,
  pipelineVersions: PropTypes.arrayOf(PropTypes.string),
  project: PropTypes.Project,
  projectSamples: PropTypes.arrayOf(PropTypes.Sample),
  reportMetadata: PropTypes.ReportMetadata,
  sample: PropTypes.Sample,
  snapshotShareId: PropTypes.string,
  view: PropTypes.string.isRequired,
};
