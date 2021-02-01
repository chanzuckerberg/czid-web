import React, { useContext } from "react";
import { get, isEmpty } from "lodash/fp";

import { deleteSample, saveVisualization } from "~/api";
import { withAnalytics, logAnalyticsEvent } from "~/api/analytics";
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
import { openUrl } from "~utils/links";

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
  const mngsWorkflow =
    get("temp_pipeline_workflow", sample) === WORKFLOWS.SHORT_READ_MNGS.value;

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

  const renderViewHeaderControls = () => {
    const { allowedFeatures } = userContext || {};

    if (
      get("temp_pipeline_workflow", sample) === WORKFLOWS.CONSENSUS_GENOME.value
    ) {
      const succeeded = get("status", currentRun) === "SUCCEEDED";
      return (
        <ViewHeader.Controls>
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
          {!succeeded && editable && deletable && (
            <PrimaryButton
              className={cs.controlElement}
              onClick={handleDeleteSample}
              text="Delete Sample"
            />
          )}
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
              // eslint-disable-next-line no-console
              onClick={() => console.log("TODO: connect to AppCues")}
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

  return (
    <ViewHeader className={cs.viewHeader}>
      <ViewHeader.Content>
        <WorkflowVersionHeader
          sampleId={get("id", sample)}
          currentRun={currentRun}
          allRuns={
            mngsWorkflow
              ? get("pipeline_runs", sample)
              : get("workflow_runs", sample)
          }
          workflowType={get("temp_pipeline_workflow", sample)}
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
                (snapshotShareId ? `/pub/${snapshotShareId}` : "") +
                  `/samples/${sample.id}`
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
