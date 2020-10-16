import React, { useContext } from "react";
import cx from "classnames";
import { get, filter, head, map } from "lodash/fp";

import BasicPopup from "~/components/BasicPopup";
import PropTypes from "~/components/utils/propTypes";
import { WORKFLOWS } from "~/components/utils/workflows";
import ViewHeader from "~/components/layout/ViewHeader";
import { UserContext } from "~/components/common/UserContext";
import { DownloadButton, SaveButton, ShareButton } from "~ui/controls/buttons";
import { openUrl } from "~utils/links";
import { withAnalytics, logAnalyticsEvent } from "~/api/analytics";
import { copyShortUrlToClipboard, parseUrlParams } from "~/helpers/url";
import { saveVisualization } from "~/api";
import { getWorkflowRunZipLink } from "~/components/views/report/utils/download";

import SampleViewControls from "./SampleViewControls";
import PipelineVersionSelect from "./PipelineVersionSelect";
import WorkflowVersionHeader from "./WorkflowVersionHeader";
import cs from "./sample_view_header.scss";

export default function SampleViewHeader({
  backgroundId,
  deletable,
  editable,
  onDetailsClick,
  onPipelineVersionChange,
  currentRun,
  project,
  projectSamples,
  reportPresent,
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

  const renderViewHeaderControls = () => {
    if (
      get("temp_pipeline_workflow", sample) === WORKFLOWS.CONSENSUS_GENOME.value
    ) {
      return (
        <ViewHeader.Controls>
          {get("status", currentRun) === "SUCCEEDED" && (
            <DownloadButton
              text="Download All"
              primary={true}
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
          )}
        </ViewHeader.Controls>
      );
    }

    return (
      <ViewHeader.Controls>
        <BasicPopup
          trigger={
            <ShareButton
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
        />{" "}
        {userContext.admin && (
          <SaveButton
            onClick={withAnalytics(
              onSaveClick,
              "SampleView_save-button_clicked",
              {
                sampleId: sample && sample.id,
              }
            )}
          />
        )}{" "}
        <SampleViewControls
          backgroundId={backgroundId}
          deletable={deletable}
          reportPresent={reportPresent}
          sample={sample}
          project={project}
          pipelineRun={currentRun}
          editable={editable}
          view={view}
        />
      </ViewHeader.Controls>
    );
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
              openUrl(`/samples/${sample.id}  `, event);
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
  reportPresent: false,
};

SampleViewHeader.propTypes = {
  backgroundId: PropTypes.number,
  deletable: PropTypes.bool,
  editable: PropTypes.bool.isRequired,
  onDetailsClick: PropTypes.func.isRequired,
  onPipelineVersionChange: PropTypes.func.isRequired,
  pipelineRun: PropTypes.PipelineRun,
  pipelineVersions: PropTypes.arrayOf(PropTypes.string),
  project: PropTypes.Project,
  projectSamples: PropTypes.arrayOf(PropTypes.Sample),
  reportPresent: PropTypes.bool,
  sample: PropTypes.Sample,
  snapshotShareId: PropTypes.string,
  view: PropTypes.string.isRequired,
};
