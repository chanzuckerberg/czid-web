// Displays the top header for the sample report page.
// Also handles the sidebar and tabs logic.
import React from "react";
import cx from "classnames";
import { get } from "lodash/fp";
import { logAnalyticsEvent, saveVisualization } from "~/api";
import {
  getURLParamString,
  parseUrlParams,
  copyShortUrlToClipboard
} from "~/helpers/url";
import { ANALYTICS_EVENT_NAMES } from "~/api/constants";
import PropTypes from "~/components/utils/propTypes";
import { pipelineVersionHasAssembly } from "~/components/utils/sample";
import AMRView from "~/components/AMRView";
import BasicPopup from "~/components/BasicPopup";
import PipelineSampleReport from "~/components/PipelineSampleReport";
import ViewHeader from "~/components/layout/ViewHeader";
import NarrowContainer from "~/components/layout/NarrowContainer";
import Tabs from "~/components/ui/controls/Tabs";
import DetailsSidebar from "~/components/common/DetailsSidebar";
import Controls from "./Controls";
import PipelineVersionSelect from "./PipelineVersionSelect";
import { SaveButton, ShareButton } from "~ui/controls/buttons";

import cs from "./sample_view.scss";

class SampleView extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      sampleName: props.sample.name,
      currentTab: "Report",
      sidebarMode: null,
      sidebarVisible: false,
      sidebarTaxonModeConfig: null
    };

    this.gsnapFilterStatus = this.generateGsnapFilterStatus();
  }

  componentDidMount() {
    // Refresh the page every 5 minutes while in progress. Purpose is so that
    // users with the page open will get some sense of updated status and see
    // when the report is done.
    // TODO: Future refactor should convert this to just fetch updated data with
    // axios so that we don't pay for the full reload. This report load is
    // currently only going: Rails -> React props.
    if (this.pipelineInProgress()) {
      setTimeout(() => {
        location.reload();
      }, 300000);
    }

    logAnalyticsEvent(ANALYTICS_EVENT_NAMES.sampleViewed, {
      sampleId: this.props.sample.id
    });
  }

  generateGsnapFilterStatus = jobStats => {
    const { jobStatistics, hostGenome } = this.props;
    if (!jobStatistics || !hostGenome || hostGenome.name !== "Human") {
      // only relevant for Human as of 5/21/2018
      return null;
    }
    for (let stat of jobStats) {
      if (stat["task"] === "gsnap_filter_out") {
        return null;
      }
    }
    return "gsnap filter on human/chimp genome was not run.";
  };

  refreshPage = (overrideUrlParams, reload = true) => {
    const newParams = Object.assign(
      {},
      this.props.reportPageParams,
      overrideUrlParams
    );
    const url =
      location.protocol +
      "//" +
      location.host +
      location.pathname +
      "?" +
      getURLParamString(newParams);
    if (reload) {
      window.location = url;
    } else {
      try {
        history.pushState(window.history.state, document.title, url);
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error(e);
        window.location = url;
      }
    }
  };

  handleTabChange = tab => {
    this.setState({ currentTab: tab });
  };

  toggleSampleDetailsSidebar = () => {
    if (
      this.state.sidebarMode === "sampleDetails" &&
      this.state.sidebarVisible
    ) {
      this.setState({
        sidebarVisible: false
      });
    } else {
      this.setState({
        sidebarMode: "sampleDetails",
        sidebarVisible: true
      });
    }
  };

  handleTaxonClick = sidebarTaxonModeConfig => {
    if (!sidebarTaxonModeConfig) {
      this.setState({
        sidebarVisible: false
      });
      return;
    }

    if (
      this.state.sidebarMode === "taxonDetails" &&
      this.state.sidebarVisible &&
      get("taxonId", sidebarTaxonModeConfig) ===
        get("taxonId", this.state.sidebarTaxonModeConfig)
    ) {
      this.setState({
        sidebarVisible: false
      });
    } else {
      this.setState({
        sidebarMode: "taxonDetails",
        sidebarTaxonModeConfig,
        sidebarVisible: true
      });
    }
  };

  closeSidebar = () => {
    this.setState({
      sidebarVisible: false
    });
  };

  handlePipelineVersionSelect = version => {
    // TODO (gdingle): do we really want to reload the page here?
    this.refreshPage({ pipeline_version: version });
  };

  handleMetadataUpdate = (key, newValue) => {
    if (key === "name") {
      this.setState({
        sampleName: newValue
      });
    }
  };

  pipelineInProgress = () => {
    if (this.props.pipelineRun && this.props.pipelineRun.finalized === 1) {
      return false;
    }
    return true;
  };

  renderVersionDisplay = () => {
    const { pipelineRun } = this.props;
    if (pipelineRun && pipelineRun.version && pipelineRun.version.pipeline) {
      const versionString = `v${pipelineRun.version.pipeline}`;
      const alignmentDBString = pipelineRun.version.alignment_db
        ? `, NT/NR: ${pipelineRun.version.alignment_db}`
        : "";

      return versionString + alignmentDBString;
    }
    return "";
  };

  renderPipelineWarnings = () => {
    const warnings = [];

    if (
      !this.pipelineInProgress() &&
      pipelineVersionHasAssembly(this.props.pipelineRun.pipeline_version) &&
      this.props.pipelineRun.assembled !== 1
    ) {
      warnings.push("The reads did not assemble for this run.");
    }

    if (warnings.length > 0) {
      const content = (
        <div>
          {warnings.map(warning => (
            <div className={cs.warning} key={warning}>
              {warning}
            </div>
          ))}
        </div>
      );
      return (
        <BasicPopup
          trigger={
            <i className={cx("fa fa-exclamation-circle", cs.warningIcon)} />
          }
          position="bottom left"
          content={content}
          wide="very"
          horizontalOffset={15}
        />
      );
    }

    return null;
  };

  renderTab = () => {
    if (this.state.currentTab === "Report") {
      const waitingSpinner = (
        <div className={cs.waitingContainer}>
          Sample {this.props.sampleStatus} ...
          <div className={cs.spinner}>
            <i className="fa fa-spinner fa-spin fa-3x" />
          </div>
        </div>
      );
      if (this.props.reportPresent) {
        return (
          <PipelineSampleReport
            sample_id={this.props.sample.id}
            projectId={this.props.project.id}
            projectName={this.props.project.name}
            admin={this.props.admin}
            allowedFeatures={this.props.allowedFeatures}
            csrf={this.props.csrf}
            report_ts={this.props.reportTime}
            git_version={this.props.gitVersion}
            all_categories={this.props.allCategories}
            all_backgrounds={this.props.allBackgrounds}
            report_details={this.props.reportDetails}
            can_see_align_viz={this.props.canSeeAlignViz}
            can_edit={this.props.canEdit}
            refreshPage={this.refreshPage}
            gsnapFilterStatus={this.gsnapFilterStatus}
            // Needs to be passed down to set the background dropdown properly.
            reportPageParams={this.props.reportPageParams}
            onTaxonClick={this.handleTaxonClick}
            savedParamValues={this.props.savedParamValues}
          />
        );
      } else if (this.pipelineInProgress()) {
        return waitingSpinner;
      } else {
        return (
          <div className={cs.failedContainer}>
            <h6 className={cs.failed}>Sample run failed</h6>
          </div>
        );
      }
    }
    if (this.state.currentTab === "Antimicrobial Resistance") {
      return <AMRView amr={this.props.amr} />;
    }
    return null;
  };

  getSidebarParams = () => {
    if (this.state.sidebarMode === "taxonDetails") {
      return this.state.sidebarTaxonModeConfig;
    }
    if (this.state.sidebarMode === "sampleDetails") {
      return {
        sampleId: this.props.sample.id,
        pipelineVersion: get(
          "pipeline_info.pipeline_version",
          this.props.reportDetails
        ),
        onMetadataUpdate: this.handleMetadataUpdate
      };
    }
    return {};
  };

  onShareClick = async () => {
    await copyShortUrlToClipboard();
  };

  onSaveClick = async () => {
    // TODO (gdingle): add analytics tracking?
    let params = parseUrlParams();
    params.sampleIds = [this.props.sample.id];
    await saveVisualization(params.view || "table", params);
  };

  render() {
    const versionDisplay = this.renderVersionDisplay();

    const {
      project,
      sampleIdToNameMap,
      pipelineVersions,
      sample,
      pipelineRun,
      summaryStats,
      amr,
      reportPresent,
      reportDetails,
      reportPageParams
    } = this.props;

    const showAMR = amr;

    return (
      <div>
        <ViewHeader className={cs.viewHeader}>
          <ViewHeader.Content>
            <div className={cs.pipelineInfo}>
              <span>PIPELINE {versionDisplay}</span>
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
                onClick: () => window.open(`/samples/${sampleId}`, "_self")
              }))}
            />
            <div className={cs.sampleDetailsLinkContainer}>
              <span
                className={cs.sampleDetailsLink}
                onClick={this.toggleSampleDetailsSidebar}
              >
                Sample Details
              </span>
            </div>
          </ViewHeader.Content>
          <ViewHeader.Controls>
            <BasicPopup
              trigger={<ShareButton onClick={this.onShareClick} />}
              content="A shareable URL has been copied to your clipboard!"
              on="click"
              hideOnScroll
            />{" "}
            {/* TODO: (gdingle): this is admin-only until we have a way of browsing visualizations */}
            {this.props.admin && <SaveButton onClick={this.onSaveClick} />}{" "}
            <Controls
              reportPresent={reportPresent}
              sample={sample}
              project={project}
              pipelineRun={pipelineRun}
              reportDetails={reportDetails}
              reportPageParams={reportPageParams}
              canEdit={this.props.canEdit}
            />
          </ViewHeader.Controls>
        </ViewHeader>
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
          onClose={this.closeSidebar}
          params={this.getSidebarParams()}
        />
      </div>
    );
  }
}

SampleView.propTypes = {
  sample: PropTypes.Sample,
  project: PropTypes.Project,
  // For each other sample in the project, map the sample id to the sample name.
  sampleIdToNameMap: PropTypes.objectOf(PropTypes.string),
  pipelineRun: PropTypes.PipelineRun,
  pipelineVersions: PropTypes.arrayOf(PropTypes.string),
  summaryStats: PropTypes.SummaryStats,
  reportPageParams: PropTypes.shape({
    pipeline_version: PropTypes.string,
    // TODO (gdingle): standardize on string or number
    background_id: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
  }),
  amr: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.number,
      gene: PropTypes.string,
      allele: PropTypes.string
    })
  ),
  reportPresent: PropTypes.bool,
  admin: PropTypes.bool,
  allowedFeatures: PropTypes.arrayOf(PropTypes.string),
  csrf: PropTypes.string,
  reportTime: PropTypes.string,
  gitVersion: PropTypes.string,
  allCategories: PropTypes.arrayOf(
    PropTypes.shape({
      taxid: PropTypes.number,
      name: PropTypes.string
    })
  ),
  allBackgrounds: PropTypes.arrayOf(PropTypes.BackgroundData),
  reportDetails: PropTypes.ReportDetails,
  canSeeAlignViz: PropTypes.bool,
  canEdit: PropTypes.bool,
  hostGenome: PropTypes.shape({
    name: PropTypes.string
  }),
  jobStatistics: PropTypes.string,
  sampleStatus: PropTypes.string,
  savedParamValues: PropTypes.object
};

export default SampleView;
