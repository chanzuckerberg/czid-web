import React from "react";
import PropTypes from "~/components/utils/propTypes";
import NarrowContainer from "~/components/layout/NarrowContainer";
import ViewHeader from "~/components/layout/ViewHeader";
import PipelineVersionSelect from "../SampleView/PipelineVersionSelect";
import { openUrl } from "~utils/links";
import cs from "./sample_view_header.scss";
import cx from "classnames";
import { get, map, maxBy } from "lodash/fp";
import moment from "moment";

class SampleViewHeader extends React.Component {
  renderVersion = () => {
    const { pipelineRun } = this.props;
    if (get("pipeline_version", pipelineRun)) {
      const alignmentDBString = pipelineRun.alignment_db
        ? `, NT/NR: ${pipelineRun.alignment_db}`
        : "";
      return `v${pipelineRun.pipeline_version}${alignmentDBString}`;
    }
    return "";
  };

  render() {
    const {
      // sampleIdToNameMap,
      // pipelineVersions,
      onPipelineVersionSelect,
      pipelineRun,
      project,
      sample,
      // summaryStats,
      // amr,
      // reportPresent,
      // reportDetails,
      // reportPageParams,
    } = this.props;

    return (
      <div>
        <NarrowContainer>
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
                  Pipeline {this.renderVersion()}
                </span>
                <PipelineVersionSelect
                  pipelineRun={pipelineRun}
                  pipelineVersions={map(
                    "pipeline_version",
                    get("pipeline_runs", sample)
                  )}
                  lastProcessedAt={get(
                    "created_at",
                    maxBy(
                      pr => moment(pr.created_at),
                      get("pipeline_runs", sample)
                    )
                  )}
                  onPipelineVersionSelect={onPipelineVersionSelect}
                />
                {/* {this.renderPipelineWarnings()} */}
              </div>
              {/* <ViewHeader.Pretitle
                breadcrumbLink={`/home?project_id=${project.id}`}
              >
                {project.name}
              </ViewHeader.Pretitle>
              <ViewHeader.Title
                label={this.state.sampleName}
                id={sample.id}
                options={Object.keys(sampleIdToNameMap).map(sampleId => ({
                  label: sampleIdToNameMap[sampleId],
                  id: sampleId,
                  onClick: () => {
                    window.open(`/samples/${sampleId}`, "_self");
                    logAnalyticsEvent("SampleView_header-title_clicked", {
                      sampleId,
                    });
                  },
                }))}
              />
              <div className={cs.sampleDetailsLinkContainer}>
                <span
                  className={cs.sampleDetailsLink}
                  onClick={withAnalytics(
                    this.toggleSampleDetailsSidebar,
                    "SampleView_sample-details-link_clicked",
                    {
                      sampleId: sample.id,
                      sampleName: sample.name,
                    }
                  )}
                >
                  Sample Details
                </span>
              </div> */}
            </ViewHeader.Content>
            {/* <ViewHeader.Controls>
              <BasicPopup
                trigger={
                  <ShareButton
                    onClick={withAnalytics(
                      this.onShareClick,
                      "SampleView_share-button_clicked",
                      {
                        sampleId: sample.id,
                        sampleName: sample.name,
                      }
                    )}
                  />
                }
                content="A shareable URL was copied to your clipboard!"
                on="click"
                hideOnScroll
              />{" "}
              {this.props.admin && (
                <SaveButton
                  onClick={withAnalytics(
                    this.onSaveClick,
                    "SampleView_save-button_clicked",
                    {
                      sampleId: sample.id,
                      sampleName: sample.name,
                    }
                  )}
                />
              )}{" "}
              <SampleViewControls
                reportPresent={reportPresent}
                sample={sample}
                project={project}
                pipelineRun={pipelineRun}
                reportDetails={reportDetails}
                reportPageParams={reportPageParams}
                canEdit={canEdit}
                view={this.state.view}
              />
            </ViewHeader.Controls> */}
          </ViewHeader>
        </NarrowContainer>
        {/* <NarrowContainer>
          {showAMR ? (
            <Tabs
              className={cs.tabs}
              tabs={["Report", "Antimicrobial Resistance"]}
              value={this.state.currentTab}
              onChange={this.handleTabChange}
            />
          ) : (
            <div className={cs.dividerContainer}>
              <div className={cs.divider} />
            </div>
          )}
          {this.renderTab()}
        </NarrowContainer>
        <DetailsSidebar
          visible={this.state.sidebarVisible}
          mode={this.state.sidebarMode}
          onClose={withAnalytics(
            this.closeSidebar,
            "SampleView_details-sidebar_closed",
            {
              sampleId: sample.id,
              sampleName: sample.name,
            }
          )}
          params={this.getSidebarParams()}
        />
        {this.coverageVizEnabled() && (
          <CoverageVizBottomSidebar
            visible={this.state.coverageVizVisible}
            onClose={withAnalytics(
              this.closeCoverageViz,
              "SampleView_coverage-viz-sidebar_closed",
              {
                sampleId: sample.id,
                sampleName: sample.name,
              }
            )}
            params={this.getCoverageVizParams()}
            sampleId={sample.id}
            pipelineVersion={this.props.pipelineRun.pipeline_version}
            nameType={this.state.nameType}
          />
        )} */}
      </div>
    );
  }
}

SampleViewHeader.propTypes = {
  onPipelineVersionSelect: PropTypes.func.isRequired,
  pipelineRun: PropTypes.PipelineRun,
  pipelineVersions: PropTypes.arrayOf(PropTypes.string),
  project: PropTypes.Project,
  sample: PropTypes.Sample,
};
// pipelineRun
// - version
//

export default SampleViewHeader;
