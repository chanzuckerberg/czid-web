import React from "react";
import moment from "moment";
import $ from "jquery";
import axios from "axios";
import cx from "classnames";
import { get } from "lodash/fp";
import { Divider, Dropdown, Popup } from "semantic-ui-react";
import { pipelineHasAssembly } from "./utils/sample";
import PipelineSampleReport from "./PipelineSampleReport";
import AMRView from "./AMRView";
import BasicPopup from "./BasicPopup";
import DownloadButtonDropdown from "~/components/ui/controls/dropdowns/DownloadButtonDropdown";
import SampleDetailsSidebar from "./views/report/SampleDetailsSidebar";
import PrimaryButton from "./ui/controls/buttons/PrimaryButton";
import ViewHeader from "./layout/ViewHeader";
import cs from "./pipeline_sample_reads.scss";
import {
  getDownloadDropdownOptions,
  getLinkInfoForDownloadOption
} from "./views/report/utils/download";

class PipelineSampleReads extends React.Component {
  constructor(props) {
    super(props);

    this.admin = props.admin;
    this.allowedFeatures = props.allowedFeatures;
    this.amr = props.amr;
    this.can_edit = props.can_edit;
    this.csrf = props.csrf;
    this.gitVersion = props.gitVersion;
    this.allBackgrounds = props.all_backgrounds;
    this.rerunPath = props.rerun_path;
    this.sampleInfo = props.sampleInfo;
    this.projectInfo = props.projectInfo;
    this.sample_map = props.project_sample_ids_names;

    this.reportPresent = props.reportPresent;
    this.reportTime = props.reportTime;
    this.allCategories = props.allCategories;
    this.reportDetails = props.reportDetails;
    this.pipelineVersions = props.pipeline_versions;

    this.jobStatistics = props.jobStatistics;
    this.summary_stats = props.summary_stats;
    this.sampleId = this.sampleInfo.id;
    this.host_genome = props.host_genome;
    this.pipelineStatus = props.sample_status;
    this.pipelineRun = props.pipelineRun;
    this.canSeeAlignViz = props.can_see_align_viz;
    this.gsnapFilterStatus = this.generateGsnapFilterStatus(this.jobStatistics);
    this.state = {
      rerunStatus: "failed",
      rerunStatusMessage: "Sample run failed",
      sample_name: props.sampleInfo.name,
      sampleDetailsSidebarVisible: false
    };

    this.deleteSample = this.deleteSample.bind(this);
    this.downloadCSV = this.downloadCSV.bind(this);
  }

  generateGsnapFilterStatus(jobStats) {
    if (!jobStats || !this.host_genome || this.host_genome.name != "Human") {
      // only relevant for Human as of 5/21/2018
      return null;
    }
    for (let stat of jobStats) {
      if (stat["task"] === "gsnap_filter_out") {
        return null;
      }
    }
    return "gsnap filter on human/chimp genome was not run.";
  }

  refreshPage = overrides => {
    const new_params = Object.assign(
      {},
      this.props.reportPageParams,
      overrides
    );
    window.location =
      location.protocol +
      "//" +
      location.host +
      location.pathname +
      "?" +
      $.param(new_params);
  };

  deleteSample() {
    axios
      .delete(`/samples/${this.sampleInfo.id}.json`, {
        data: { authenticity_token: this.csrf }
      })
      .then(() => {
        location.href = `/home?project_id=${this.projectInfo.id}`;
      })
      .catch(err => {});
  }

  toggleSampleDetailsSidebar = () => {
    this.setState({
      sampleDetailsSidebarVisible: !this.state.sampleDetailsSidebarVisible
    });
  };

  pipelineInProgress() {
    if (this.pipelineRun && this.pipelineRun.finalized === 1) {
      return false;
    }
    return true;
  }

  static setTab(section, tab) {
    window.localStorage.setItem(section, tab);
  }

  fetchParams(param) {
    let url = new URL(window.location);
    return url.searchParams.get(param);
  }

  downloadCSV() {
    let resParams = {};
    const stringer = require("querystring");

    // Set the right CSV background ID.
    // Should have background_id param in all cases now.
    const givenBackgroundId = this.fetchParams("background_id");
    if (givenBackgroundId) resParams["background_id"] = givenBackgroundId;

    // Set the right pipeline version.
    let v = this.pipelineRun && this.pipelineRun.pipeline_version;
    if (v) resParams["pipeline_version"] = v;

    let res = `/samples/${this.sampleId}/report_csv`;
    res += `?${stringer.stringify(resParams)}`;
    location.href = res;
  }

  componentDidMount() {
    $("ul.tabs").tabs();

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
  }

  handleDownload = option => {
    if (option === "download_csv") {
      this.downloadCSV();
      return;
    }
    const linkInfo = getLinkInfoForDownloadOption(option, this.sampleInfo.id);
    if (linkInfo) {
      window.open(linkInfo.path, linkInfo.newPage ? "_blank" : "_self");
    }
  };

  renderPipelineWarnings = () => {
    const warnings = [];

    if (
      !this.pipelineInProgress() &&
      pipelineHasAssembly(this.pipelineRun) &&
      this.pipelineRun.assembled !== 1
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
        <Popup
          trigger={
            <i className={cx("fa fa-exclamation-circle", cs.warningIcon)} />
          }
          position="bottom left"
          content={content}
          inverted
          wide="very"
          horizontalOffset={15}
        />
      );
    } else {
      return null;
    }
  };

  handleMetadataUpdate = (key, newValue) => {
    if (key === "name") {
      this.setState({
        sample_name: newValue
      });
    }
  };

  render() {
    let d_report = null;
    let waitingSpinner = (
      <div>
        Sample {this.pipelineStatus} ...
        <p>
          <i className="fa fa-spinner fa-spin fa-3x" />
        </p>
      </div>
    );

    let date_available =
      this.summary_stats && this.summary_stats.last_processed_at;
    let run_date_blurb = "";
    if (date_available) {
      run_date_blurb =
        "processed " +
        moment(this.summary_stats.last_processed_at)
          .startOf("second")
          .fromNow();
    }

    // Ex: 'processed 5 days ago' text or dropdown menu with version selector.
    let pipeline_version_blurb;
    if (this.pipelineVersions.length > 1) {
      // Show a little dropdown menu for version selection.
      let cur_version = this.pipelineRun.pipeline_version;
      let other_versions = this.pipelineVersions.filter(v => v !== cur_version);
      pipeline_version_blurb = (
        <span>
          {"| "}
          <Dropdown text={run_date_blurb} className="version-dropdown">
            <Dropdown.Menu>
              {other_versions.map(version => {
                const phash = { pipeline_version: version };
                return (
                  <Dropdown.Item
                    onClick={() => {
                      this.refreshPage(phash);
                    }}
                    key={version}
                  >
                    {"Pipeline v" + version}
                  </Dropdown.Item>
                );
              })}
            </Dropdown.Menu>
          </Dropdown>
        </span>
      );
      pipeline_version_blurb = (
        <BasicPopup
          trigger={pipeline_version_blurb}
          content={"Select Report Version"}
          position={"right"}
        />
      );
    } else {
      // Old blurb without version selector.
      pipeline_version_blurb = (
        <span>
          {"| "} {run_date_blurb}
        </span>
      );
    }

    if (this.reportPresent) {
      d_report = (
        <PipelineSampleReport
          sample_id={this.sampleId}
          projectId={this.projectInfo.id}
          projectName={this.projectInfo.name}
          admin={this.admin}
          allowedFeatures={this.allowedFeatures}
          csrf={this.csrf}
          report_ts={this.reportTime}
          git_version={this.gitVersion}
          all_categories={this.allCategories}
          all_backgrounds={this.allBackgrounds}
          report_details={this.reportDetails}
          can_see_align_viz={this.canSeeAlignViz}
          can_edit={this.can_edit}
          refreshPage={this.refreshPage}
          gsnapFilterStatus={this.gsnapFilterStatus}
          // Needs to be passed down to set the background dropdown properly.
          reportPageParams={this.props.reportPageParams}
        />
      );
    } else if (this.pipelineInProgress()) {
      d_report = (
        <div className="center-align text-grey text-lighten-2 no-report sample-wait-top">
          {waitingSpinner}
        </div>
      );
    } else {
      d_report = (
        <div className="center-align text-grey text-lighten-2 no-report">
          <h6 className={this.state.rerunStatus}>
            {this.state.rerunStatus === "success"
              ? waitingSpinner
              : this.state.rerunStatusMessage}
          </h6>
        </div>
      );
    }

    let version_display = "";
    if (
      this.pipelineRun &&
      this.pipelineRun.version &&
      this.pipelineRun.version.pipeline
    ) {
      version_display = "v" + this.pipelineRun.version.pipeline;
    }

    if (version_display !== "" && this.pipelineRun.version.alignment_db) {
      version_display =
        version_display + ", NT/NR: " + this.pipelineRun.version.alignment_db;
    }

    let report_buttons = null;
    if (this.reportPresent) {
      const downloadOptions = [
        {
          text: "Download Report Table (.csv)",
          value: "download_csv"
        },
        ...getDownloadDropdownOptions(
          this.pipelineRun,
          get("assembled_taxids", this.reportDetails)
        )
      ];

      report_buttons = (
        <DownloadButtonDropdown
          options={downloadOptions}
          onClick={this.handleDownload}
          direction="left"
        />
      );
    } else if (this.sampleInfo.status === "created" || !this.reportPresent) {
      report_buttons = (
        <PrimaryButton onClick={this.deleteSample} text="Delete Sample" />
      );
    }

    let show_amr = this.amr != null;
    let amr_tab = show_amr ? (
      <li className="tab">
        <a href="#amr" className="">
          Antimicrobial Resistance
        </a>
      </li>
    ) : null;
    let amr_table = show_amr ? (
      <div id="amr" className="reports-screen container tab-screen col s12">
        <AMRView amr={this.amr} />
      </div>
    ) : null;
    const multipleTabs = show_amr;

    return (
      <div>
        <ViewHeader className={cs.viewHeader}>
          <ViewHeader.Content>
            <div className={cs.pipelineInfo}>
              PIPELINE {version_display} {pipeline_version_blurb}{" "}
              {this.renderPipelineWarnings()}
            </div>
            <ViewHeader.Pretitle
              breadcrumbLink={`/home?project_id=${this.projectInfo.id}`}
            >
              {this.projectInfo.name}
            </ViewHeader.Pretitle>
            <ViewHeader.Title
              label={this.state.sample_name}
              id={this.sampleId}
              options={Object.keys(this.sample_map).map(sampleId => ({
                label: this.sample_map[sampleId],
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
          <ViewHeader.Controls>{report_buttons}</ViewHeader.Controls>
        </ViewHeader>

        {multipleTabs && (
          <div className="sub-header-navigation">
            <div className="nav-content">
              <ul className="tabs tabs-transparent">
                <li className="tab">
                  <a href="#reports" className="active">
                    Report
                  </a>
                </li>
                {amr_tab}
              </ul>
            </div>
          </div>
        )}
        <Divider
          className={cx(cs.reportsDivider, multipleTabs && cs.hasTabs)}
        />

        {amr_table}

        <div
          id="reports"
          className="reports-screen container tab-screen col s12"
        >
          {d_report}
        </div>
        <SampleDetailsSidebar
          visible={this.state.sampleDetailsSidebarVisible}
          onClose={this.toggleSampleDetailsSidebar}
          sampleId={this.sampleId}
          onMetadataUpdate={this.handleMetadataUpdate}
        />
      </div>
    );
  }
}

export default PipelineSampleReads;
