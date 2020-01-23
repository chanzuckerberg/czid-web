import React, { useContext } from "react";
import cx from "classnames";
import { get, map } from "lodash/fp";

import BasicPopup from "~/components/BasicPopup";
import PropTypes from "~/components/utils/propTypes";
import SampleViewControls from "../SampleView/SampleViewControls";
import ViewHeader from "~/components/layout/ViewHeader";
import { UserContext } from "~/components/common/UserContext";
import { SaveButton, ShareButton } from "~ui/controls/buttons";
import { openUrl } from "~utils/links";
import { withAnalytics, logAnalyticsEvent } from "~/api/analytics";
import { copyShortUrlToClipboard, parseUrlParams } from "~/helpers/url";
import { saveVisualization } from "~/api";

import PipelineVersionSelect from "../SampleView/PipelineVersionSelect";
import cs from "./sample_view_header.scss";

export default function SampleViewHeader({
  backgroundId,
  deletable,
  editable,
  onDetailsClick,
  onPipelineVersionChange,
  pipelineRun,
  project,
  projectSamples,
  reportPresent,
  sample,
  view,
  minContigSize,
}) {
  const userContext = useContext(UserContext);

  const renderVersion = () => {
    if (!pipelineRun) {
      return "";
    }

    const pipelineRunVersionString = pipelineRun.pipeline_version
      ? `v${pipelineRun.pipeline_version}`
      : "N/A";
    const alignmentConfigName = get("alignment_config_name", pipelineRun);
    const alignmentConfigNameString = alignmentConfigName
      ? `, NT/NR: ${alignmentConfigName}`
      : "";
    return `${pipelineRunVersionString}${alignmentConfigNameString}`;
  };

  const onSaveClick = async () => {
    if (view) {
      const params = parseUrlParams();
      params.sampleIds = [sample.id];
      await saveVisualization(view, params);
    }
  };

  return (
    <ViewHeader className={cs.viewHeader}>
      <ViewHeader.Content>
        <div
          className={cx(
            cs.pipelineInfo,
            get("pipeline_version", pipelineRun) && cs.linkToPipelineViz
          )}
          onClick={() =>
            get("pipeline_version", pipelineRun) &&
            openUrl(
              `/samples/${sample.id}/pipeline_viz/${get(
                "pipeline_version",
                pipelineRun
              )}`,
              event
            )
          }
        >
          <span className={cs.pipelineRunVersion}>
            Pipeline {renderVersion()}
          </span>
          <PipelineVersionSelect
            pipelineRun={pipelineRun}
            pipelineVersions={map(
              "pipeline_version",
              get("pipeline_runs", sample)
            )}
            lastProcessedAt={get("created_at", pipelineRun)}
            onPipelineVersionSelect={version => {
              logAnalyticsEvent("SampleView_pipeline-select_clicked", {
                sampleId: sample.id,
                pipelineVersion: version,
              });
              onPipelineVersionChange(version);
            }}
          />
        </div>
        <ViewHeader.Pretitle
          breadcrumbLink={project && `/home?project_id=${project.id}`}
        >
          {project ? project.name : ""}
        </ViewHeader.Pretitle>
        <ViewHeader.Title
          label={sample && sample.name}
          id={sample && sample.id}
          options={projectSamples.map(sample => ({
            label: sample.name,
            id: sample.id,
            onClick: () => {
              openUrl(`/samples/${sample.id}/show_v2`, event);
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
          pipelineRun={pipelineRun}
          editable={editable}
          view={view}
          minContigSize={minContigSize}
        />
      </ViewHeader.Controls>
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
  view: PropTypes.string.isRequired,
  minContigSize: PropTypes.number,
};
