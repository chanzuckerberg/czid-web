import React, { Component } from "react";
import axios from "axios";
import ReactDOM from "react-dom";
import moment from "moment";
import $ from "jquery";
import Materialize from "materialize-css";
import {
  Sidebar,
  Popup,
  Dropdown,
  Label,
  Icon,
  Modal,
  Button,
  Form
} from "semantic-ui-react";
import Nanobar from "nanobar";
import SortHelper from "./SortHelper";
import numberWithCommas from "../helpers/strings";
import ProjectSelection from "./ProjectSelection";
import StringHelper from "../helpers/StringHelper";

class Samples extends React.Component {
  constructor(props, context) {
    super(props, context);
    this.nanobar = new Nanobar({
      id: "prog-bar",
      class: "prog-bar"
    });
    this.csrf = props.csrf;
    this.favoriteProjects = props.favorites || [];
    this.allProjects = props.projects || [];
    this.pageSize = props.pageSize || 30;

    this.fetchAllSelectedIds = this.fetchAllSelectedIds.bind(this);
    this.handleSearch = this.handleSearch.bind(this);
    this.columnSorting = this.columnSorting.bind(this);
    this.handleSearchChange = this.handleSearchChange.bind(this);
    this.loadMore = this.loadMore.bind(this);
    this.scrollDown = this.scrollDown.bind(this);
    this.fetchResults = this.fetchResults.bind(this);
    this.handleStatusFilterSelect = this.handleStatusFilterSelect.bind(this);
    this.setUrlLocation = this.setUrlLocation.bind(this);
    this.sortSamples = this.sortSamples.bind(this);
    this.switchColumn = this.switchColumn.bind(this);
    this.handleProjectSelection = this.handleProjectSelection.bind(this);
    this.handleAddUser = this.handleAddUser.bind(this);
    this.editableProjects = props.editableProjects;
    this.canEditProject = this.canEditProject.bind(this);
    this.fetchProjectUsers = this.fetchProjectUsers.bind(this);
    this.updateProjectUserState = this.updateProjectUserState.bind(this);
    this.updateUserDisplay = this.updateUserDisplay.bind(this);
    this.selectSample = this.selectSample.bind(this);
    this.compareSamples = this.compareSamples.bind(this);
    this.clearAllFilters = this.clearAllFilters.bind(this);
    this.selectTissueFilter = this.selectTissueFilter.bind(this);
    this.selectHostFilter = this.selectHostFilter.bind(this);
    this.displayMetadataDropdown = this.displayMetadataDropdown.bind(this);
    this.handleColumnSelectChange = this.handleColumnSelectChange.bind(this);
    this.columnHidden = this.columnHidden.bind(this);
    this.startReportGeneration = this.startReportGeneration.bind(this);
    this.checkReportDownload = this.checkReportDownload.bind(this);
    this.displayReportProgress = this.displayReportProgress.bind(this);

    this.state = {
      invite_status: null,
      project: null,
      project_users: [],
      totalNumber: null,
      projectId: null,
      displaySelectSamples: true, // this.checkURLContent(),
      selectedProjectId: this.fetchParams("project_id") || null,
      filterParams: this.fetchParams("filter") || "",
      searchParams: this.fetchParams("search") || "",
      sampleIdsParams: this.fetchParams("ids") || [],
      allSamples: [],
      tissueTypes: [],
      hostGenomes: [],
      sort_by: this.fetchParams("sort_by") || "id,desc",
      pagesLoaded: 0,
      pageEnd: false,
      hostFilterChange: false,
      tissueFilterChange: false,
      allChecked: false,
      selectedSampleIds: [],
      displayDropdown: false,
      selectedTissueFilters: this.fetchParams("tissue")
        ? this.fetchParams("tissue").split(",")
        : [],
      selectedHostIndices: this.fetchParams("host")
        ? this.fetchParams("host")
            .split(",")
            .map(Number)
        : [],
      initialFetchedSamples: [],
      loading: false,
      isRequesting: false,
      displayEmpty: false,
      checkInUpdate: true,
      resetTissues: !(
        this.fetchParams("tissue") && this.fetchParams("tissue").length > 0
      ),
      resetHosts: !(
        this.fetchParams("host") && this.fetchParams("host").length > 0
      ),
      project_id_download_in_progress: null,
      project_add_email_validation: null,
      projectType: this.fetchParams("type") || "all",
      columnsShown: [
        "total_reads",
        "nonhost_reads",
        "quality_control",
        "compression_ratio",
        "host_genome",
        "location",
        "pipeline_status"
      ],
      allColumns: [
        "total_reads",
        "nonhost_reads",
        "quality_control",
        "compression_ratio",
        "host_genome",
        "location",
        "pipeline_status",
        "notes",
        "nucleotide_type",
        "tissue_type"
      ]
    };

    this.sortCount = 0;
    this.COLUMN_DISPLAY_MAP = {
      total_reads: {
        display_name: "Total reads",
        type: "pipeline_data"
      },
      nonhost_reads: {
        display_name: "Non-host reads",
        type: "pipeline_data"
      },
      quality_control: {
        display_name: "Passed QC",
        tooltip: "Passed quality control",
        type: "pipeline_data"
      },
      compression_ratio: {
        display_name: "DCR",
        tooltip: "Duplicate compression ratio",
        type: "pipeline_data"
      },
      pipeline_status: {
        display_name: "Status",
        type: "pipeline_data"
      },
      nucleotide_type: {
        display_name: "Nucleotide type",
        type: "metadata"
      },
      location: {
        display_name: "Location",
        type: "metadata"
      },
      host_genome: {
        display_name: "Host",
        type: "metadata"
      },
      tissue_type: {
        display_name: "Tissue type",
        type: "metadata"
      },
      notes: {
        display_name: "Notes",
        type: "metadata"
      }
    };

    $(document).ready(function() {
      $("select").material_select();
      $(".modal").modal({
        inDuration: 0,
        outDuration: 0
      });
    });
  }

  initializeTooltip() {
    // only updating the tooltip offset when the component is loaded
    $(() => {
      const tooltipIdentifier = $("[rel='tooltip']");
      tooltipIdentifier.tooltip({
        delay: 0,
        html: true,
        placement: "top",
        offset: "0px 50px"
      });
    });
  }

  selectTissueFilter(e) {
    const filterList = this.state.selectedTissueFilters.slice(0);

    let filterIndex;
    let selectedFilter = e.target.getAttribute("data-status");

    if (e.target.checked) {
      filterList.push(selectedFilter);
    } else {
      filterIndex = filterList.indexOf(selectedFilter);
      filterList.splice(filterIndex, 1);
    }
    this.setState(
      {
        selectedTissueFilters: filterList
      },
      () => {
        this.setUrlLocation("none");
      }
    );
  }

  selectHostFilter(e) {
    // current array of options
    const hostList = this.state.selectedHostIndices.slice(0);
    let index;
    // check if the check box is checked or unchecked
    if (e.target.checked) {
      // add the numerical value of the checkbox to options array
      hostList.push(+e.target.id);
    } else {
      // or remove the value from the unchecked checkbox from the array
      index = hostList.indexOf(+e.target.id);
      hostList.splice(index, 1);
    }
    // update the state with the new array of options
    this.setState(
      {
        selectedHostIndices: hostList
      },
      () => {
        this.setUrlLocation("none");
      }
    );
  }

  canEditProject(projectId) {
    return this.editableProjects.indexOf(parseInt(projectId)) > -1;
  }

  displayReportProgress(res) {
    $(".download-progress")
      .html(
        `<i className="fa fa-circle-o-notch fa-spin fa-fw"></i> ${
          res.data.status_display
        }`
      )
      .css("display", "block");
    setTimeout(() => {
      this.checkReportDownload();
    }, 2000);
  }

  startReportGeneration() {
    this.nanobar.go(30);
    axios
      .get(`/projects/${this.state.selectedProjectId}/make_project_reports_csv`)
      .then(res => {
        this.setState({
          project_id_download_in_progress: this.state.selectedProjectId
        });
        this.displayReportProgress(res);
      })
      .catch(() => {});
  }

  checkReportDownload() {
    axios
      .get(
        `/projects/${
          this.state.project_id_download_in_progress
        }/project_reports_csv_status`
      )
      .then(res => {
        let download_status = res.data.status_display;
        if (download_status === "complete") {
          location.href = `/projects/${
            this.state.project_id_download_in_progress
          }/send_project_reports_csv`;
          this.setState({
            project_id_download_in_progress: null
          });
        } else {
          this.displayReportProgress(res);
        }
      })
      .catch(() => {
        this.setState(
          {
            project_id_download_in_progress: null
          },
          () => {
            Materialize.toast(
              `Failed to download report for '${this.state.project.name}'`,
              3000,
              "rounded"
            );
          }
        );
      });
  }

  sortSamples() {
    this.sortCount += 1;
    let new_sort = "";
    if (this.sortCount === 3) {
      this.sortCount = 0;
      new_sort = "id,desc";
    } else {
      new_sort = this.state.sort_by === "name,asc" ? "name,desc" : "name,asc";
    }
    this.setState({ sort_by: new_sort }, () => {
      this.setUrlLocation();
      this.nanobar.go(30);
      this.fetchResults();
    });
  }

  columnSorting(e) {
    const className = e.target.className;
    const pos = className.indexOf("sort_by");
    const sort_query = className.substr(pos).split(" ")[0];
    this.setState({ sort_query });
    SortHelper.applySort(sort_query);
  }

  fetchParams(param) {
    let urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(param);
  }

  updateProjectUserState(email_array) {
    this.setState({ project_users: email_array });
  }
  fetchProjectUsers(id) {
    if (!id || !this.canEditProject(id)) {
      this.updateProjectUserState([]);
    } else {
      axios
        .get(`/projects/${id}/all_emails.json`)
        .then(res => {
          this.updateProjectUserState(res.data.emails);
        })
        .catch(() => {
          this.updateProjectUserState([]);
        });
    }
  }

  toggleProjectVisibility(projId, publicAccess) {
    if (projId) {
      axios
        .put(`/projects/${projId}.json`, {
          public_access: publicAccess,
          authenticity_token: this.csrf
        })
        .then(() => {
          this.setState({
            project: Object.assign(this.state.project, {
              public_access: publicAccess
            })
          });
        })
        .catch(() => {
          Materialize.toast(
            `Unable to change project visibility for '${
              this.state.project.name
            }'`,
            3000,
            "rounded"
          );
        });
    }
  }

  displayMetadataDropdown() {
    this.setState({
      displayDropdown: !this.state.displayDropdown
    });
  }

  updateUserDisplay(email_to_add) {
    let new_project_users = this.state.project_users;
    if (!new_project_users.includes(email_to_add)) {
      new_project_users.push(email_to_add);
      this.setState({ project_users: new_project_users });
    }
  }

  handleAddUser(email_to_add) {
    let project_id = this.state.selectedProjectId;
    const isValidEmail = StringHelper.validateEmail(email_to_add);
    if (isValidEmail) {
      this.setState({
        project_add_email_validation: null,
        invite_status: "sending"
      });
      axios
        .put(`/projects/${project_id}/add_user`, {
          user_email_to_add: email_to_add,
          authenticity_token: this.csrf
        })
        .then(() => {
          this.updateUserDisplay(email_to_add);
          this.setState({
            invite_status: "sent"
          });
        });
    } else {
      this.setState({
        project_add_email_validation: "Invalid email address, try again?"
      });
    }
  }

  handleSearchChange(e) {
    let val = e.target.value;
    if (val !== "") {
      this.setState({ searchParams: val });
    } else {
      this.setState(
        {
          searchParams: ""
        },
        () => {
          this.setUrlLocation();
          this.fetchResults();
        }
      );
    }
  }

  switchColumn(column_name, position) {
    const columnsShown = Object.assign([], this.state.columnsShown);
    columnsShown[position] = column_name;
    this.setState({ columnsShown });
  }

  appendStatusIcon(status) {
    let klass = "";
    switch (status) {
      case "WAITING":
        klass = "waiting fa fa-arrow-up";
        break;
      case "INPROGRESS":
        klass = "uploading fa fa-repeat";
        break;
      case "POST PROCESSING":
        klass = "uploading fa fa-repeat";
        break;
      case "HOST FILTERING":
        klass = "uploading fa fa-repeat";
        break;
      case "ALIGNMENT":
        klass = "uploading fa fa-repeat";
        break;
      case "FAILED":
        klass = "failed fa fa-times";
        break;
      case "COMPLETE":
        klass = "complete fa fa-check";
        break;
      default:
        klass = "waiting fa fa-arrow-up";
    }
    return <i className={klass} aria-hidden="true" />;
  }

  formatRunTime(runtime) {
    runtime = Number(runtime);
    const h = Math.floor(runtime / 3600);
    const m = Math.floor((runtime % 3600) / 60);
    const s = Math.floor((runtime % 3600) % 60);

    const hDisplay = h > 0 ? h + (h === 1 ? " hour, " : " hours, ") : "";
    const mDisplay = m > 0 ? m + (m === 1 ? " minute, " : " minutes, ") : "";
    const sDisplay = s > 0 ? s + (s === 1 ? " second" : " seconds") : "";
    return hDisplay + mDisplay + sDisplay;
  }

  renderPipelineOutput(samples) {
    let BLANK_TEXT = <span className="blank">NA</span>;
    return samples.map((sample, i) => {
      let dbSample = sample.db_sample;
      let derivedOutput = sample.derived_sample_output;
      let runInfo = sample.run_info;
      let uploader = sample.uploader.name;
      let descrip = runInfo.job_status_description;
      let statusClass = !descrip
        ? this.applyChunkStatusClass(runInfo)
        : this.applyClass(descrip);
      let status = !descrip ? this.getChunkedStage(runInfo) : descrip;

      const stageStatus = (
        <div className={`${statusClass} status`}>
          {this.appendStatusIcon(status)}
          <span>{status}</span>
        </div>
      );

      const sample_name_info = (
        <SampleNameInfo parent={this} dbSample={dbSample} uploader={uploader} />
      );
      let stats = derivedOutput.summary_stats;
      const data_values = PipelineOutputDataValues({
        derivedOutput,
        BLANK_TEXT,
        stats,
        dbSample
      });

      return (
        <PipelineOutputCards
          i={i}
          key={i}
          dbSample={dbSample}
          report_ready={sample.run_info.report_ready}
          sample_name_info={sample_name_info}
          stageStatus={stageStatus}
          total_runtime={runInfo.total_runtime}
          data_values={data_values}
          parent={this}
        />
      );
    });
  }

  //Load more samples on scroll
  scrollDown() {
    var that = this;
    $(window).scroll(function() {
      if (
        $(window).scrollTop() >
        $(document).height() - $(window).height() - 6000
      ) {
        {
          !that.state.isRequesting && !that.state.pageEnd
            ? that.loadMore()
            : null;
        }
        return false;
      }
    });
  }

  //load more paginated samples
  loadMore() {
    const params = this.getParams();
    this.setState({ isRequesting: true });
    axios
      .get(`/samples?${params}`)
      .then(res => {
        this.setState(prevState => ({
          isRequesting: false,
          allSamples: [...prevState.allSamples, ...res.data.samples],
          pagesLoaded: prevState.pagesLoaded + 1,
          pageEnd: res.data.samples.length < this.pageSize
        }));
      })
      .catch(() => {
        this.setState(prevState => ({
          isRequesting: false,
          allSamples: [...prevState.allSamples],
          pagesLoaded: prevState.pagesLoaded,
          pageEnd: prevState.pageEnd
        }));
      });
  }

  //fetch project, filter and search params
  getParams() {
    let params = `filter=${this.state.filterParams}&page=${this.state
      .pagesLoaded + 1}&search=${this.state.searchParams}&sort_by=${
      this.state.sort_by
    }`;
    let projectId = parseInt(this.state.selectedProjectId);

    if (projectId) {
      params += `&project_id=${projectId}`;
    }
    if (this.state.sampleIdsParams.length) {
      let sampleParams = this.state.sampleIdsParams;
      params += `&ids=${sampleParams}`;
    }

    if (this.state.selectedTissueFilters.length) {
      let tissueParams = this.state.selectedTissueFilters.join(",");
      params += `&tissue=${tissueParams}`;
    } else if (this.state.tissueTypes.length > 0) {
      // initializing or all the tissue types are NA
      params += "&tissue=none";
    }

    if (this.state.selectedHostIndices.length) {
      let hostParams = this.state.selectedHostIndices.join(",");
      params += `&host=${hostParams}`;
    } else if (this.state.hostGenomes.length > 0) {
      // initializing (before first results are selected)
      params += "&host=none";
    }

    return params;
  }

  allTissueTypes(all_tissues) {
    return all_tissues.length == 0 || all_tissues.indexOf("-") >= 0
      ? all_tissues
      : ["-", ...all_tissues];
  }

  //fetch results from filtering, search or switching projects
  fetchResults(cb, reset_filters = false) {
    this.nanobar.go(30);
    // always fetch from page one
    this.state.pagesLoaded = 0;
    this.state.pageEnd = false;
    this.state.isRequesting = true;
    const params = this.getParams();
    axios
      .get(`/samples?${params}`)
      .then(res => {
        this.nanobar.go(100);
        this.setState(prevState => ({
          initialFetchedSamples: res.data.samples,
          allSamples: res.data.samples,
          tissueTypes: this.allTissueTypes(res.data.tissue_types),
          selectedTissueFilters:
            reset_filters || prevState.resetTissues
              ? this.allTissueTypes(res.data.tissue_types)
              : prevState.selectedTissueFilters,
          hostGenomes: res.data.host_genomes,
          selectedHostIndices:
            reset_filters || prevState.resetHosts
              ? res.data.host_genomes.map(h => h.id)
              : prevState.selectedHostIndices,
          displayEmpty: false,
          checkInUpdate: false, //don't trigger more update if it's from the fetchResults
          resetTissues: false,
          resetHosts: false,
          totalNumber: res.data.total_count,
          pagesLoaded: prevState.pagesLoaded + 1,
          pageEnd: res.data.samples.length < this.pageSize,
          isRequesting: false
        }));
        if (!this.state.allSamples.length) {
          this.setState({ displayEmpty: true });
        }
        if (typeof cb === "function") {
          cb();
        }
      })
      .catch(() => {
        this.setState({
          initialFetchedSamples: [],
          allSamples: [],
          displayEmpty: true
        });
        if (typeof cb === "function") {
          cb();
        }
      });
  }

  applyClass(status) {
    if (status === "COMPLETE") {
      return "complete";
    } else if (status === "WAITING") {
      return "waiting";
    } else if (status === "INPROGRESS") {
      return "uploading";
    } else if (status === "FAILED") {
      return "failed";
    }
  }

  applyChunkStatusClass(runInfo) {
    let postProcess = runInfo["Post Processing"];
    let hostFiltering = runInfo["Host Filtering"];
    let alignment = runInfo["GSNAPL/RAPSEARCH alignment"];
    if (postProcess) {
      return postProcess === "LOADED" ? "complete" : "uploading";
    } else if (alignment) {
      return alignment === "FAILED" ? "failed" : "uploading";
    } else if (hostFiltering) {
      return hostFiltering === "FAILED" ? "failed" : "uploading";
    }
  }

  getChunkedStage(runInfo) {
    let postProcess = runInfo["Post Processing"];
    let hostFiltering = runInfo["Host Filtering"];
    let alignment = runInfo["GSNAPL/RAPSEARCH alignment"];
    if (alignment === "FAILED" || hostFiltering === "FAILED") {
      return "FAILED";
    } else if (postProcess) {
      if (postProcess === "LOADED") {
        return "COMPLETE";
      } else if (postProcess === "FAILED") {
        return "COMPLETE*";
      } else {
        return "POST PROCESSING";
      }
    } else if (alignment) {
      return "ALIGNMENT";
    } else if (hostFiltering) {
      return "HOST FILTERING";
    } else {
      return "WAITING";
    }
  }

  //handle search when query is passed
  handleSearch(e) {
    if (e.target.value !== "" && e.key === "Enter") {
      this.nanobar.go(30);
      this.setState(
        {
          searchParams: e.target.value
        },
        () => {
          this.setUrlLocation();
          this.fetchResults();
        }
      );
    }
  }

  fetchProjectDetails(projId, resetFilters = true) {
    if (!projId) {
      this.setState({
        selectedProjectId: null,
        project: null
      });
      this.fetchResults(null, resetFilters);
    } else {
      projId = parseInt(projId);
      axios
        .get(`projects/${projId}.json`)
        .then(res => {
          this.setState({
            project: res.data
          });
          this.fetchProjectUsers(projId);
          this.fetchResults(null, resetFilters);
        })
        .catch(() => {
          this.setState({ project: null });
        });
    }
  }

  viewSample(id, e) {
    e.preventDefault();
    // _satellite.track('viewsample')

    window.open(`/samples/${id}`);
  }

  renderEmptyTable() {
    return (
      <div className="center-align">
        <i className="fa fa-frown-o"> No result found</i>
      </div>
    );
  }

  displayDownloadDropdown() {
    $(".download-dropdown").dropdown({
      constrainWidth: false, // Does not change width of dropdown to that of the activator
      gutter: 0, // Spacing from edge
      belowOrigin: true, // Displays dropdown below the button
      alignment: "left", // Displays dropdown with edge aligned to the left of button
      stopPropagation: true // Stops event propagation
    });
  }

  findSelectedColumns(sel) {
    const res = [];
    for (let i = 0; i < sel.length; i++) {
      const column_name = sel.options[i].value;
      if (sel.options[i].selected && column_name !== "") {
        res.push(column_name);
      }
    }
    return res;
  }

  handleColumnSelectChange(e) {
    const selected_columns = this.findSelectedColumns(e.target);
    this.setState({ columnsShown: selected_columns });
  }

  columnHidden(column) {
    return !this.state.columnsShown.includes(column);
  }

  fetchAllSelectedIds(e) {
    let sampleList = this.state.selectedSampleIds;
    const checked = e.target.checked;
    const allSamples = this.state.allSamples;
    for (let sample of allSamples) {
      if (sample.run_info.report_ready != 1) {
        continue;
      }
      let sample_id = sample.db_sample.id;
      if (checked) {
        if (sampleList.indexOf(sample_id) === -1) {
          sampleList.push(sample_id);
        }
      } else {
        let index = sampleList.indexOf(sample_id);
        if (index >= 0) {
          sampleList.splice(index, 1);
        }
      }
    }
    this.setState({
      allChecked: checked,
      selectedSampleIds: sampleList
    });
  }

  compareSamples() {
    if (this.state.selectedSampleIds.length) {
      location.href = `/samples/heatmap?sample_ids=${
        this.state.selectedSampleIds
      }`;
    }
  }

  clearAllFilters() {
    this.setState(
      {
        filterParams: "",
        searchParams: "",
        sampleIdsParams: [],
        selectedTissueFilters: [],
        selectedHostIndices: []
      },
      () => {
        this.setUrlLocation();
        this.fetchResults(null, true);
      }
    );
  }

  selectSample(e) {
    // current array of options
    const sampleList = this.state.selectedSampleIds;

    let sample_id = parseInt(e.target.getAttribute("data-sample-id"));

    if (e.target.checked) {
      // add the numerical value of the checkbox to options array
      if (sampleList.indexOf(sample_id) < 0) {
        sampleList.push(+sample_id);
      }
    } else {
      // or remove the value from the unchecked checkbox from the array
      let index = sampleList.indexOf(+sample_id);
      if (index >= 0) {
        sampleList.splice(index, 1);
      }
    }
    // update the state with the new array of options
    this.setState({
      allChecked: false,
      selectedSampleIds: sampleList
    });
  }

  applyExcluded(e, type, state_var) {
    let id = e.target.getAttribute("data-exclude");
    if (type === "int") {
      id = +id;
    }
    let list = Object.assign([], this.state[state_var]);
    let index = list.indexOf(id);
    list.splice(index, 1);
    if (index >= 0) {
      let new_state = {
        [`${state_var}`]: list
      };
      this.setState(new_state, () => {
        this.setUrlLocation("none");
        this.fetchResults();
      });
    }
  }

  generateTagList(
    state_all_options,
    state_selected_options,
    prefix,
    id_field = null,
    name_field = null,
    id_type = null
  ) {
    let result = this.state[state_all_options].map((entry, i) => {
      let id = id_field ? entry[id_field] : entry;
      let name = name_field ? entry[name_field] : entry;
      if (this.state[state_selected_options].indexOf(id) >= 0) {
        return (
          <LabelTagMarkup
            state_all_options={state_all_options}
            key={i}
            i={i}
            name={name}
            prefix={prefix}
            id={id}
            id_type={id_type}
            state_selected_options={state_selected_options}
            parent={this}
          />
        );
      } else {
        return null;
      }
    });
    return result;
  }

  renderTable(samples) {
    let project_id = this.state.selectedProjectId
      ? this.state.selectedProjectId
      : "all";
    let search_field = (
      <TableSearchField searchParams={this.state.searchParams} parent={this} />
    );

    let table_download_dropdown = (
      <TableDownloadDropdown project_id={project_id} parent={this} />
    );

    let check_all = (
      <div className="check-all">
        <input
          type="checkbox"
          id="checkAll"
          className="filled-in checkAll"
          checked={this.state.allChecked}
          onClick={this.fetchAllSelectedIds}
        />
        <label htmlFor="checkAll" />
      </div>
    );

    let compare_button = (
      <div className="download-table">
        <div className="white">
          <a onClick={this.compareSamples} className="compare center">
            <span>Compare</span>
          </a>
        </div>
      </div>
    );

    const host_filter_tag_list = this.generateTagList(
      "hostGenomes",
      "selectedHostIndices",
      "Host: ",
      "id",
      "name",
      "int"
    );

    const tissue_filter_tag_list = this.generateTagList(
      "tissueTypes",
      "selectedTissueFilters",
      "Tissue: "
    );

    const search_box = (
      <div className="row search-box">
        {this.state.displaySelectSamples ? check_all : null}
        {search_field}
        {<MetadataFilter state={this.state} parent={this} />}
      </div>
    );

    let proj_users_count = this.state.project_users.length;
    let proj = this.state.project;
    const project_menu = (
      <ProjectHeaderMenu
        proj={proj}
        proj_users_count={proj_users_count}
        parent={this}
      />
    );

    let samplesCount = this.state.allSamples.length;
    const selectedStr = this.state.selectedSampleIds.length
      ? `${this.state.selectedSampleIds.length} samples selected.`
      : "";

    const projInfo = (
      <ProjectInfoHeading
        proj={proj}
        samplesCount={samplesCount}
        selectedStr={selectedStr}
        project_menu={project_menu}
        table_download_dropdown={table_download_dropdown}
        compare_button={compare_button}
        state={this.state}
      />
    );

    let filterSelect = this.handleStatusFilterSelect;
    let all_caps = ["WAITING", "UPLOADING", "CHECKED", "FAILED", "ALL"];
    let uppercase = ["Waiting", "In Progress", "Complete", "Failed", "All"];
    let lowercase = ["waiting", "uploading", "complete", "failed", "all"];

    const filterStatus = (
      <JobStatusFilters
        all_caps={all_caps}
        filterSelect={filterSelect}
        lowercase={lowercase}
        uppercase={uppercase}
      />
    );

    const tableHead = (
      <TableColumnHeaders
        sort={this.state.sort_by}
        colMap={this.COLUMN_DISPLAY_MAP}
        filterStatus={filterStatus}
        state={this.state}
        parent={this}
      />
    );

    return (
      <FilterListMarkup
        projInfo={projInfo}
        search_box={search_box}
        host_filter_tag_list={host_filter_tag_list}
        tissue_filter_tag_list={tissue_filter_tag_list}
        tableHead={tableHead}
        samples={samples}
        parent={this}
      />
    );
  }

  componentDidUpdate(prevProps, prevState) {
    const prevStatus = prevState.filterParams;
    const currentStatus = this.state.filterParams;
    const prevHostIndices = prevState.selectedHostIndices;
    const prevTissueFilters = prevState.selectedTissueFilters;
    const prevSelectedProject = prevState.selectedProjectId;

    if (prevSelectedProject !== this.state.selectedProjectId) {
      window.scrollTo(0, 0);
    }
    if (prevStatus !== currentStatus) {
      $(`i[data-status="${prevStatus}"]`).removeClass("active");
    } else {
      $(`i[data-status="${currentStatus}"]`).addClass("active");
    }

    if (this.state.checkInUpdate) {
      //fetchResults hasn't run since the host/tissue change
      if (prevHostIndices.length !== this.state.selectedHostIndices.length) {
        this.setState({
          hostFilterChange: true
        });
      }

      if (
        prevTissueFilters.length !== this.state.selectedTissueFilters.length
      ) {
        this.setState({
          tissueFilterChange: true
        });
      }

      if (
        !this.state.displayDropdown &&
        (this.state.hostFilterChange || this.state.tissueFilterChange)
      ) {
        this.setUrlLocation("none");
        this.fetchResults();
        this.state.hostFilterChange = false;
        this.state.tissueFilterChange = false;
      }
    } else {
      this.state.checkInUpdate = true;
    }
  }

  componentDidMount() {
    $(() => {
      const win = $(window);
      const samplesHeader = $(".sample-table-container");
      const siteHeaderHeight = $(".site-header").height();
      const projectWrapper = $(".project-wrapper");
      let prevScrollTop = 0;
      let marginTop = 0;
      win.scroll(() => {
        const scrollTop = win.scrollTop();
        const scrollDirection =
          scrollTop >= prevScrollTop ? "downward" : "upward";
        if (scrollTop > samplesHeader.offset().top) {
          samplesHeader.addClass("shadow");
        } else {
          samplesHeader.removeClass("shadow");
        }
        if (scrollDirection === "downward") {
          const scrollDiff = siteHeaderHeight - scrollTop;
          marginTop = scrollDiff > 0 ? scrollDiff : 0;
        } else {
          const scrollDiff = siteHeaderHeight - scrollTop;
          marginTop =
            scrollDiff < 0 ? 0 : Math.abs(scrollTop - siteHeaderHeight);
        }
        projectWrapper.css({ marginTop });
        prevScrollTop = scrollTop;
      });
      $(".filter").hide();
    });
    this.closeMetadataDropdown();
    this.displayDownloadDropdown();
    this.initializeTooltip();
    this.fetchProjectDetails(this.state.selectedProjectId, false);
    this.scrollDown();
    this.displayPipelineStatusFilter();
    this.initializeColumnSelect();
  }

  initializeColumnSelect() {
    $(document).ready(function() {
      $("select").material_select();
    });
    $(ReactDOM.findDOMNode(this.refs.columnSelector)).on(
      "change",
      this.handleColumnSelectChange.bind(this)
    );
  }

  // initialize filter dropdown
  displayPipelineStatusFilter() {
    $(".status-dropdown, .menu-dropdown").dropdown({
      belowOrigin: true,
      stopPropagation: false,
      constrainWidth: false
    });
  }

  //handle filtering when a filter is selected from list
  handleStatusFilterSelect(e) {
    let status = e.target.getAttribute("data-status");
    this.setState(
      {
        filterParams: status
      },
      () => {
        this.setUrlLocation();
        this.fetchResults();
      }
    );
  }

  selectionToParamsOrNone(selected_options, value_when_empty = "") {
    return selected_options.length == 0
      ? value_when_empty
      : selected_options.join(",");
  }

  //set Url based on requests
  setUrlLocation(value_when_empty = "") {
    let projectId = parseInt(this.state.selectedProjectId);
    let tissueFilter = this.selectionToParamsOrNone(
      this.state.selectedTissueFilters,
      value_when_empty
    );
    if (this.state.tissueTypes.length == 0) {
      tissueFilter = "";
    }
    const params = {
      project_id: projectId ? projectId : null,
      filter: this.state.filterParams,
      tissue: tissueFilter,
      host: this.selectionToParamsOrNone(
        this.state.selectedHostIndices,
        value_when_empty
      ),
      search: this.state.searchParams,
      ids: this.state.sampleIdsParams,
      sort_by: this.state.sort_by,
      type: this.state.projectType
    };
    window.history.replaceState(null, null, `?${$.param(params)}`);
  }

  handleProjectSelection(id, listType) {
    this.setState(
      {
        selectedProjectId: id,
        projectType: listType,
        filterParams: "",
        searchParams: "",
        checkInUpdate: false,
        allChecked: false,
        selectedTissueFilters: [],
        selectedHostIndices: [],
        tissueTypes: [],
        hostGenomes: [],
        sampleIdsParams: []
      },
      () => {
        this.setUrlLocation();
        this.fetchProjectDetails(id);
      }
    );
  }

  closeMetadataDropdown() {
    let that = this;
    $(document).on("click", function(event) {
      if ($(event.target).has(".wrapper").length) {
        if (that.state.displayDropdown) {
          that.setState({
            displayDropdown: false
          });
        }
      }
    });
  }

  render() {
    const project_section = (
      <ProjectSelection
        favoriteProjects={this.favoriteProjects}
        allProjects={this.allProjects}
        csrf={this.csrf}
        selectProject={this.handleProjectSelection}
      />
    );

    return (
      <div className="row content-body">
        <Sidebar
          className="col no-padding s2 sidebar"
          animation="push"
          visible
          icon="labeled"
        >
          <div>{project_section}</div>
        </Sidebar>

        <Sidebar.Pusher className="col no-padding samples-content s10">
          {this.renderTable(this.state.allSamples)}
        </Sidebar.Pusher>
      </div>
    );
  }
}

function LabelTagMarkup({
  state_all_options,
  i,
  name,
  prefix,
  id,
  id_type,
  state_selected_options,
  parent
}) {
  return (
    <Label
      className="label-tags"
      size="tiny"
      key={`${state_all_options}_tag_${i}`}
    >
      {`${prefix}${name}`}
      <Icon
        name="close"
        data-exclude={id}
        onClick={e => {
          parent.applyExcluded(e, id_type, state_selected_options);
        }}
      />
    </Label>
  );
}

function FilterItemMarkup({ status, filterSelect, lowercase, pos, uppercase }) {
  return (
    <li
      className="filter-item"
      key={pos}
      data-status={status}
      onClick={filterSelect}
    >
      <a data-status={status} className={"filter-item " + lowercase[pos]}>
        {uppercase[pos]}
      </a>
      <i data-status={status} className="filter fa fa-check hidden" />
    </li>
  );
}

function ColumnDropdown({
  pos,
  colMap,
  column_name,
  filterStatus,
  allColumns,
  columnsShown,
  parent
}) {
  return (
    <li key={`shown-${pos}`}>
      <ColumnPopups pos={pos} colMap={colMap} column_name={column_name} />
      <ul
        className="dropdown-content column-dropdown"
        id={`column-dropdown-${pos}`}
      >
        {column_name === "pipeline_status" ? <div>{filterStatus}</div> : null}
        <li>
          <a className="title">
            <b>Switch column</b>
          </a>
        </li>
        {allColumns.map((name, i) => {
          return (
            <ColumnEntries
              columnsShown={columnsShown}
              name={name}
              key={i}
              i={i}
              column_name={column_name}
              colMap={colMap}
              pos={pos}
              parent={parent}
            />
          );
        })}
      </ul>
    </li>
  );
}

function FilterListMarkup({
  projInfo,
  search_box,
  host_filter_tag_list,
  tissue_filter_tag_list,
  tableHead,
  samples,
  parent
}) {
  return (
    <div className="row content-wrapper">
      <div className="project-info col s12">{projInfo}</div>
      <div className="divider" />
      <div className="sample-container no-padding col s12">
        {search_box}
        <div className="filter-tags-list">
          {host_filter_tag_list} {tissue_filter_tag_list}
        </div>
        <div className="sample-table-container row">
          {tableHead}
          {!samples.length && parent.state.displayEmpty
            ? parent.renderEmptyTable()
            : parent.renderPipelineOutput(samples)}
        </div>
      </div>
      {!parent.state.pageEnd && parent.state.allSamples.length > 14 ? (
        <div className="scroll">
          <i className="fa fa-spinner fa-spin fa-3x" />
        </div>
      ) : (
        ""
      )}
    </div>
  );
}

function ColumnEntries({
  columnsShown,
  name,
  i,
  column_name,
  colMap,
  pos,
  parent
}) {
  return columnsShown.includes(name) ? (
    <li
      key={`all-${i}`}
      className={`disabled column_name ${
        column_name === name ? "current" : ""
      }`}
    >
      {colMap[name].display_name}
      {column_name === name ? <i className="fa fa-check right" /> : null}
    </li>
  ) : (
    <li
      key={`all-${i}`}
      className="selectable column_name"
      onClick={() => parent.switchColumn(name, pos)}
    >
      {colMap[name].display_name}
    </li>
  );
}

function SampleNameInfo({ parent, dbSample, uploader }) {
  return (
    <span
      onClick={e => parent.viewSample(dbSample.id, e)}
      className="sample-name-info"
    >
      <div className="card-label top-label">
        <span className="upload-date">
          Uploaded{" "}
          {moment(dbSample.created_at)
            .startOf("second")
            .fromNow()}
        </span>
      </div>
      <div className="card-label center-label sample-name">{dbSample.name}</div>
      <div className="card-label author bottom-label author">
        {!uploader || uploader === "" ? (
          ""
        ) : (
          <span>Uploaded by: {uploader}</span>
        )}
      </div>
    </span>
  );
}

function PipelineOutputDataValues({
  derivedOutput,
  BLANK_TEXT,
  stats,
  dbSample
}) {
  return {
    total_reads: !derivedOutput.pipeline_run
      ? BLANK_TEXT
      : numberWithCommas(derivedOutput.pipeline_run.total_reads),
    nonhost_reads:
      !stats || !stats.remaining_reads
        ? BLANK_TEXT
        : numberWithCommas(stats.remaining_reads),
    nonhost_reads_percent:
      !stats || !stats.percent_remaining ? (
        ""
      ) : (
        <span className="percent">
          {" "}
          {`(${stats.percent_remaining.toFixed(2)}%)`}{" "}
        </span>
      ),
    quality_control:
      !stats || !stats.qc_percent
        ? BLANK_TEXT
        : `${stats.qc_percent.toFixed(2)}%`,
    compression_ratio:
      !stats || !stats.compression_ratio
        ? BLANK_TEXT
        : stats.compression_ratio.toFixed(2),
    tissue_type:
      dbSample && dbSample.sample_tissue ? dbSample.sample_tissue : BLANK_TEXT,
    nucleotide_type:
      dbSample && dbSample.sample_template
        ? dbSample.sample_template
        : BLANK_TEXT,
    location:
      dbSample && dbSample.sample_location
        ? dbSample.sample_location
        : BLANK_TEXT,
    host_genome:
      derivedOutput && derivedOutput.host_genome_name
        ? derivedOutput.host_genome_name
        : BLANK_TEXT,
    notes:
      dbSample && dbSample.sample_notes ? dbSample.sample_notes : BLANK_TEXT
  };
}

function PipelineOutputCards({
  i,
  dbSample,
  report_ready,
  sample_name_info,
  stageStatus,
  total_runtime,
  data_values,
  parent
}) {
  return (
    <a className="col s12 no-padding sample-feed" key={i}>
      <div>
        <div className="samples-card white">
          <div className="flex-container">
            <ul className="flex-items">
              <SampleCardCheckboxes
                dbSample={dbSample}
                report_ready={report_ready}
                sample_name_info={sample_name_info}
                i={i}
                parent={parent}
              />
              <SampleDetailedColumns
                dbSample={dbSample}
                stageStatus={stageStatus}
                total_runtime={total_runtime}
                data_values={data_values}
                parent={parent}
              />
            </ul>
          </div>
        </div>
      </div>
    </a>
  );
}

function MetadataFilter({ state, parent }) {
  return (
    <div className="col s2 wrapper">
      <div
        className={
          state.displayDropdown ? "metadata metadata-active" : "metadata"
        }
        onClick={parent.displayMetadataDropdown}
      >
        <div className="metadata-dropdown">Filter</div>
        <i
          className={
            state.displayDropdown ? "fa fa-angle-up" : "fa fa-angle-down"
          }
        />
      </div>
      <MetadataFilterDropdowns state={state} parent={parent} />
    </div>
  );
}

function TableSearchField({ searchParams, parent }) {
  let search_field_width = "col s3 no-padding";
  return (
    <div className={search_field_width + " search-field"}>
      <div className="row">
        <i className="fa search-icon left fa-search" />
        <input
          id="search"
          value={searchParams}
          onChange={parent.handleSearchChange}
          onKeyDown={parent.handleSearch}
          className="search col s12"
          placeholder="Search"
        />
      </div>
    </div>
  );
}

function TableDownloadDropdown({ project_id, parent }) {
  return (
    <div className="download-wrapper">
      <Dropdown
        button
        className="icon link download-btn"
        labeled
        icon={{ className: "cloud download alternate" }}
        text="Download"
      >
        <Dropdown.Menu>
          <Dropdown.Item href={`/projects/${project_id}/csv`}>
            Download Table
          </Dropdown.Item>
          {project_id === "all" ? null : (
            <Dropdown.Item
              onClick={parent.startReportGeneration}
              className="download-reports"
            >
              Download Reports
            </Dropdown.Item>
          )}
        </Dropdown.Menu>
      </Dropdown>
    </div>
  );
}

class AddUserModal extends React.Component {
  constructor(props) {
    super(props);
    this.state = { modalOpen: false, email: "" };
    this.handleOpen = this.handleOpen.bind(this);
    this.handleClose = this.handleClose.bind(this);
    this.handleChange = this.handleChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
  }
  handleOpen() {
    this.setState({ modalOpen: true, email: "" });
    this.props.parent.setState({
      invite_status: "",
      project_add_email_validation: ""
    });
  }
  handleClose() {
    this.setState({ modalOpen: false, email: "" });
  }
  handleChange(e, { name, value }) {
    this.setState({ email: value });
  }
  handleSubmit() {
    this.props.parent.handleAddUser(this.state.email);
  }

  render() {
    return (
      <Modal
        trigger={<a onClick={this.handleOpen}>Add User</a>}
        open={this.state.modalOpen}
        onClose={this.handleClose}
        className="modal project-popup add-user-modal"
      >
        <Modal.Header className="project_modal_header">
          Project Members and Access Control
        </Modal.Header>
        <Modal.Content className="modal-content">
          <div className="project_modal_title">
            {this.props.state.project ? this.props.state.project.name : null}
          </div>
          <div className="project_modal_visibility">
            {this.props.state.project ? (
              this.props.state.project.public_access ? (
                <span>
                  <i className="tiny material-icons">lock_open</i>
                  <span className="label">Public Project</span>
                </span>
              ) : (
                <span>
                  <i className="tiny material-icons">lock</i>
                  <span className="label">Private Project</span>
                  <a
                    href="#"
                    onClick={() =>
                      this.props.parent.toggleProjectVisibility(
                        this.props.state.project.id,
                        1
                      )
                    }
                  >
                    Make project public
                  </a>
                </span>
              )
            ) : null}
          </div>
          <AddUserModalMemberArea state={this.props.state} parent={this} />
        </Modal.Content>
        <Modal.Actions>
          <button className="modal-close" onClick={this.handleClose}>
            Close
          </button>
        </Modal.Actions>
      </Modal>
    );
  }
}

function ProjectHeaderMenu({ proj, proj_users_count, parent }) {
  return (
    <div className="right col s12">
      <ul className="project-menu">
        <li>
          {proj ? (
            proj.public_access ? (
              <span>
                <i className="tiny material-icons">lock_open</i> Public project
              </span>
            ) : (
              <span>
                <i className="tiny material-icons">lock</i> Private project
              </span>
            )
          ) : null}
        </li>
        <li>
          {proj && parent.canEditProject(proj.id) ? (
            proj_users_count ? (
              <span>
                <i className="tiny material-icons">people</i>{" "}
                {parent.state.project_users.length}
                {parent.state.project_users.length > 1 ? " members" : " member"}
              </span>
            ) : (
              <span>No member</span>
            )
          ) : null}
        </li>
        <li className="add-member">
          {proj && parent.canEditProject(proj.id) ? (
            <AddUserModal parent={parent} state={parent.state} />
          ) : null}
        </li>
      </ul>
    </div>
  );
}

function ProjectInfoHeading({
  proj,
  samplesCount,
  selectedStr,
  project_menu,
  table_download_dropdown,
  compare_button,
  state
}) {
  return (
    <div className="row download-section">
      <div className="col s6 wrapper">
        <div
          className={
            !proj ? "proj-title heading all-proj" : "heading proj-title"
          }
        >
          {!proj ? (
            <div className="">All Samples</div>
          ) : (
            <div>
              <span className="">{proj.name}</span>
            </div>
          )}
        </div>
        <p className="subheading col no-padding s12">
          {samplesCount === 0
            ? "No sample found"
            : samplesCount === 1
              ? "1 sample found"
              : `Showing ${samplesCount} out of ${
                  state.totalNumber
                } total samples. ${selectedStr}`}
        </p>
      </div>
      <div className="col s6 download-section-btns">
        {state.selectedProjectId ? project_menu : null}
        {table_download_dropdown}
        {state.selectedSampleIds.length > 0 ? compare_button : null}
      </div>
    </div>
  );
}

function TableColumnHeaders({ sort, colMap, filterStatus, state, parent }) {
  return (
    <div className="col s12 sample-feed-head no-padding samples-table-head">
      <div className="samples-card white">
        <div className="flex-container">
          <ul className="flex-items">
            <li className="sample-name-info">
              <div className="card-label column-title center-label sample-name">
                <div className="sort-able" onClick={parent.sortSamples}>
                  <span>Name</span>
                  <i
                    className={`fa ${
                      sort === "name,desc"
                        ? "fa fa-sort-alpha-desc"
                        : "fa fa-sort-alpha-asc"
                    }
                  ${
                    sort === "name,desc" || sort === "name,asc"
                      ? "active"
                      : "hidden"
                  }`}
                  />
                </div>
              </div>
            </li>

            {state.columnsShown.map((column_name, pos) => {
              return (
                <ColumnDropdown
                  pos={pos}
                  key={pos}
                  colMap={colMap}
                  column_name={column_name}
                  filterStatus={filterStatus}
                  allColumns={state.allColumns}
                  columnsShown={state.columnsShown}
                  parent={parent}
                />
              );
            })}
          </ul>
        </div>
      </div>
    </div>
  );
}

function JobStatusFilters({ all_caps, filterSelect, lowercase, uppercase }) {
  return (
    <div className="dropdown-status-filtering">
      <li>
        <a className="title">
          <b>Filter status</b>
        </a>
      </li>

      {all_caps.map((status, pos) => {
        return FilterItemMarkup({
          status,
          filterSelect,
          lowercase,
          pos,
          uppercase
        });
      })}
      <li className="divider" />
    </div>
  );
}

function ColumnPopups({ pos, colMap, column_name }) {
  return (
    <Popup
      trigger={
        <div
          className="card-label column-title center-label sample-name center menu-dropdown"
          data-activates={`column-dropdown-${pos}`}
        >
          {colMap[column_name].display_name} <i className="fa fa-caret-down" />
        </div>
      }
      size="mini"
      className={!colMap[column_name].tooltip ? "hidden-popup" : ""}
      content={colMap[column_name].tooltip}
      hideOnScroll
      inverted
    />
  );
}

function SampleCardCheckboxes({
  dbSample,
  report_ready,
  sample_name_info,
  i,
  parent
}) {
  return (
    <li className="check-box-container">
      {parent.state.displaySelectSamples ? (
        <div>
          <input
            type="checkbox"
            id={i}
            onClick={parent.selectSample}
            key={`sample_${dbSample.id}`}
            data-sample-id={dbSample.id}
            className="filled-in checkbox"
            checked={parent.state.selectedSampleIds.indexOf(dbSample.id) >= 0}
            disabled={report_ready != 1}
          />{" "}
          <label htmlFor={i}>{sample_name_info}</label>
        </div>
      ) : (
        sample_name_info
      )}
    </li>
  );
}

function SampleDetailedColumns({
  dbSample,
  stageStatus,
  total_runtime,
  data_values,
  parent
}) {
  return parent.state.columnsShown.map((column, pos) => {
    let column_data = "";
    if (column === "pipeline_status") {
      column_data = (
        <li key={pos} onClick={parent.viewSample.bind(parent, dbSample.id)}>
          <div className="card-label top-label">{stageStatus}</div>
          <div className="card-label center-label">
            {total_runtime ? (
              <span className="time">
                <i className="fa fa-clock-o" aria-hidden="true" />
                <span className="duration-label">
                  {parent.formatRunTime(total_runtime)}
                </span>
              </span>
            ) : null}
          </div>
        </li>
      );
    } else if (column === "nonhost_reads") {
      column_data = (
        <li key={pos}>
          <div className="card-label center center-label data-label">
            {data_values[column]} {data_values["nonhost_reads_percent"]}
          </div>
        </li>
      );
    } else {
      column_data = (
        <li key={pos} onClick={parent.viewSample.bind(parent, dbSample.id)}>
          <div className="card-label center center-label data-label">
            {data_values[column]}
          </div>
        </li>
      );
    }
    return column_data;
  });
}

function MetadataFilterDropdowns({ state, parent }) {
  if (state.displayDropdown) {
    return (
      <div className="row metadata-options">
        <div className="col s6">
          <h6>Host</h6>
          {state.hostGenomes.length == 0 ? (
            <div className="options-wrapper">
              <label>No host genome data present</label>
            </div>
          ) : (
            state.hostGenomes.map((host, i) => {
              let indices = state.selectedHostIndices;
              let res = (
                <div key={i} className="options-wrapper">
                  <input
                    name="host"
                    type="checkbox"
                    data-id={host.id}
                    checked={indices.indexOf(host.id) < 0 ? "" : "checked"}
                    value={indices.indexOf(i) != -1}
                    onChange={parent.selectHostFilter}
                    id={host.id}
                    className="filled-in human"
                  />
                  <label htmlFor={host.id}>{host.name}</label>
                </div>
              );
              return res;
            })
          )}
        </div>
        <div className="col s6">
          <h6>Tissue</h6>
          {state.tissueTypes.length == 0 ? (
            <div className="options-wrapper">
              <label>No tissue data present</label>
            </div>
          ) : (
            state.tissueTypes.map((tissue, i) => {
              let res = (
                <div key={i} className="options-wrapper">
                  <input
                    name="tissue"
                    type="checkbox"
                    id={tissue}
                    className="filled-in"
                    data-status={tissue}
                    checked={
                      state.selectedTissueFilters.indexOf(tissue) < 0
                        ? ""
                        : "checked"
                    }
                    onChange={parent.selectTissueFilter}
                  />
                  <label htmlFor={tissue}>{tissue}</label>
                </div>
              );
              return res;
            })
          )}
        </div>
      </div>
    );
  } else {
    return null;
  }
}

function AddUserModalMemberArea({ state, parent }) {
  return (
    <div>
      <div className="add_member row">
        <Form onSubmit={parent.handleSubmit}>
          <Form.Field>
            <Form.Input
              placeholder="Add project members by email"
              className="validate col s12 browser-default"
              id="add_user_to_project"
              type="email"
              onChange={parent.handleChange}
            />
          </Form.Field>
          <Button className="add_member_action" type="submit">
            Add member
          </Button>
        </Form>
        <div className="error-message">
          {state.project_add_email_validation}
        </div>
        {state.invite_status === "sending" ? (
          <div className="status-message">
            <i className="fa fa-circle-o-notch fa-spin fa-fw" />
            Hang tight, sending invitation...
          </div>
        ) : null}
        {state.invite_status === "sent" ? (
          <div className="status-message status teal-text text-darken-2">
            <i className="fa fa-smile-o fa-fw" />
            Yay! User has been added
          </div>
        ) : null}
      </div>
      <div className="members_list">
        <div className="list_title">
          <i className="tiny material-icons">person_add</i> Project Members
        </div>
        <ul>
          {state.project_users.length > 0 ? (
            state.project_users.map(email => {
              return <li key={email}>{email}</li>;
            })
          ) : (
            <li key="None">None</li>
          )}
        </ul>
      </div>
    </div>
  );
}

export default Samples;
