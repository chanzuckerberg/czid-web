import React from "react";
import PropTypes from "prop-types";
import NarrowContainer from "~/components/layout/NarrowContainer";
import ViewHeader from "~/components/layout/ViewHeader";

class SampleViewHeader extends React.Component {
  render() {
    const {
      // project,
      // sampleIdToNameMap,
      // pipelineVersions,
      // sample,
      // pipelineRun,
      // summaryStats,
      // amr,
      // reportPresent,
      // reportDetails,
      // reportPageParams,
    } = this.props;

    const showAMR = amr;
    const pipelineVersion =
      pipelineRun && pipelineRun.version && pipelineRun.version.pipeline;
    return (
      <div>
        <NarrowContainer>
          <ViewHeader className={cs.viewHeader}>
            <ViewHeader.Content>
              <div
                className={cx(
                  cs.pipelineInfo,
                  pipelineVersion && cs.linkToPipelineViz
                )}
                onClick={() =>
                  pipelineVersion &&
                  window.open(
                    `/samples/${sample.id}/pipeline_viz/${pipelineVersion}`
                  )
                }
              >
                <span>PIPELINE {this.renderVersionDisplay()}</span>
                <PipelineVersionSelect
                  pipelineRun={pipelineRun}
                  pipelineVersions={pipelineVersions}
                  lastProcessedAt={get("last_processed_at", summaryStats)}
                  onPipelineVersionSelect={this.handlePipelineVersionSelect}
                />
                {this.renderPipelineWarnings()}
              </div>
              <ViewHeader.Pretitle
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
              </div>
            </ViewHeader.Content>
            <ViewHeader.Controls>
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
              {/* TODO: (gdingle): this is admin-only until we have a way of browsing visualizations */}
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
                canEdit={this.props.canEdit}
                view={this.state.view}
              />
            </ViewHeader.Controls>
          </ViewHeader>
        </NarrowContainer>
        <NarrowContainer>
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
        )}
      </div>
    );
  }
}
