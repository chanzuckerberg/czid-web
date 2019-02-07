import React from "react";
import axios from "axios";
import ReactDOM from "react-dom";
import moment from "moment";
import cx from "classnames";
import $ from "jquery";
import Materialize from "materialize-css";
import {
  difference,
  intersection,
  keyBy,
  map,
  min,
  partition,
  take,
  union
} from "lodash";
// TODO(mark): Refactor lodash/fp functions into a file of immutable utilities.
import { merge, sortBy } from "lodash/fp";
import { Sidebar, Label, Icon, Modal, Form } from "semantic-ui-react";
import Nanobar from "nanobar";
import SortHelper from "./SortHelper";
import ProjectSelection from "./ProjectSelection";
import BasicPopup from "./BasicPopup";
import Cookies from "js-cookie";
import CompareButton from "./ui/controls/buttons/CompareButton";
import PhylogenyButton from "./ui/controls/buttons/PhylogenyButton";
import DownloadButtonDropdown from "./ui/controls/dropdowns/DownloadButtonDropdown";
import PrimaryButton from "./ui/controls/buttons/PrimaryButton";
import SecondaryButton from "./ui/controls/buttons/SecondaryButton";
import MultipleDropdown from "./ui/controls/dropdowns/MultipleDropdown";
import PhyloTreeCreationModal from "./views/phylo_tree/PhyloTreeCreationModal";
import TableColumnHeader from "./views/samples/TableColumnHeader";
import PipelineStatusFilter from "./views/samples/PipelineStatusFilter";
import ProjectUploadMenu from "./views/samples/ProjectUploadMenu";
import CategorySearchBox from "./ui/controls/CategorySearchBox";
import FilterTag from "./ui/controls/FilterTag";
import ProjectSettingsModal from "./views/samples/ProjectSettingsModal";
import GlobeIcon from "~ui/icons/GlobeIcon";
import LockIcon from "~ui/icons/LockIcon";
import UserIcon from "~ui/icons/UserIcon";
import {
  SAMPLE_TABLE_COLUMNS,
  INITIAL_COLUMNS,
  ALL_COLUMNS
} from "./views/samples/constants";
import { getSampleTableData } from "./views/samples/utils";
// TODO(mark): Convert styles/samples.scss to CSS modules.
import cs from "./samples.scss";
import { openUrl } from "./utils/links";
import { publicSampleNotificationsByProject } from "./views/samples/notifications";

class Samples extends React.Component {
  constructor(props, context) {
    super(props, context);
    this.nanobar = new Nanobar({
      id: "prog-bar",
      class: "prog-bar"
    });
    this.csrf = props.csrf;
    this.admin = props.admin;
    this.allowedFeatures = props.allowedFeatures;
    this.favoriteProjects = props.favorites || [];
    this.allProjects = props.projects || [];
    this.pageSize = props.pageSize || 30;

    this.getSampleAttribute = this.getSampleAttribute.bind(this);
    this.handleSearch = this.handleSearch.bind(this);
    this.columnSorting = this.columnSorting.bind(this);
    this.handleSearchChange = this.handleSearchChange.bind(this);
    this.loadMore = this.loadMore.bind(this);
    this.scrollDown = this.scrollDown.bind(this);
    this.setUrlLocation = this.setUrlLocation.bind(this);
    this.sortSamples = this.sortSamples.bind(this);
    this.switchColumn = this.switchColumn.bind(this);
    this.handleProjectSelection = this.handleProjectSelection.bind(this);
    this.editableProjects = props.editableProjects;
    this.canEditProject = this.canEditProject.bind(this);
    this.fetchProjectUsers = this.fetchProjectUsers.bind(this);
    this.updateProjectUserState = this.updateProjectUserState.bind(this);
    this.updateUserDisplay = this.updateUserDisplay.bind(this);
    this.selectSample = this.selectSample.bind(this);
    this.compareSamples = this.compareSamples.bind(this);
    this.handleCreateBackground = this.handleCreateBackground.bind(this);
    this.clearAllFilters = this.clearAllFilters.bind(this);
    this.selectTissueFilter = this.selectTissueFilter.bind(this);
    this.selectHostFilter = this.selectHostFilter.bind(this);
    this.displayMetadataDropdown = this.displayMetadataDropdown.bind(this);
    this.handleColumnSelectChange = this.handleColumnSelectChange.bind(this);
    this.columnHidden = this.columnHidden.bind(this);
    this.startReportGeneration = this.startReportGeneration.bind(this);
    this.checkReportDownload = this.checkReportDownload.bind(this);
    this.displayReportProgress = this.displayReportProgress.bind(this);
    this.deleteProject = this.deleteProject.bind(this);
    this.state = {
      background_creation_response: {},
      project: null,
      project_users: [],
      // Number of samples in the current query, as defined by the filters.
      numFilteredSamples: 0,
      // Total number of samples in the current project.
      numTotalSamples: 0,
      projectId: null,
      displaySelectSamples: true, // this.checkURLContent(),
      selectedProjectId: this.fetchParams("project_id") || null,
      filterParams: this.fetchParams("filter"),
      searchParams: this.fetchParams("search"),
      sampleIdsParams: this.fetchParams("ids", true),
      // The list of fetched sample ids, in the order to be displayed
      fetchedSampleIds: [],
      // A map of fetched sample id to sample data.
      fetchedSamples: {},
      tissueTypes: [],
      hostGenomes: [],
      sort_by: this.fetchParams("sort_by") || "id,desc",
      pagesLoaded: 0,
      pageEnd: false,
      hostFilterChange: false,
      tissueFilterChange: false,
      // Ids for ready samples in the entire current query, not just the current page.
      // Used for the 'toggle all selected' checkbox.
      readySampleIdsForFilter: [],
      selectedSampleIds: [],
      displayDropdown: false,

      // For structured search suggestions
      selectedLocations: this.fetchParams("location", true),
      selectedTaxids: this.fetchParams("taxid", true),
      selectedUploaderIds: this.fetchParams("selectedUploaderIds", true),
      searchTags: [],

      selectedTissueFilters: this.fetchParams("tissue", true),
      selectedHostIndices: this.fetchParams("host")
        ? this.fetchParams("host")
            .split(",")
            .map(Number)
        : [],
      loading: false,
      isRequesting: false,
      // Whether a filter is currently being applied for the fetched samples.
      // Determines whether to show the 'X samples matching filters' label.
      areSamplesFiltered: false,
      displayEmpty: false,
      checkInUpdate: true,
      resetTissues: !(
        this.fetchParams("tissue") && this.fetchParams("tissue").length > 0
      ),
      resetHosts: !(
        this.fetchParams("host") && this.fetchParams("host").length > 0
      ),
      project_id_download_in_progress: null,
      projectType: this.fetchParams("type") || "all",
      columnsShown: INITIAL_COLUMNS,
      phyloTreeCreationModalOpen: false
    };

    this.sortCount = 0;

    $(document).ready(function() {
      $("select").material_select();
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

  getSampleAttribute(sample, key) {
    let value;
    if (key === "name" || key === "project_id") {
      value = sample.db_sample[key];
    } else if (key === "pipeline_run_id") {
      let pipeline_run = sample.derived_sample_output.pipeline_run;
      if (pipeline_run) {
        value = pipeline_run.id;
      }
    }
    return value;
  }

  removeFilterTag = (entry, i) => {
    let selected = this.state[entry.key];
    for (let val of entry.values) {
      let idx = selected.indexOf(val);
      if (idx > -1) {
        selected.splice(idx, 1);
      }
    }
    let newTags = this.state.searchTags;
    newTags.splice(i, 1);
    this.setState(
      {
        [entry.key]: selected,
        searchTags: newTags
      },
      () => {
        this.setUrlLocation();
        this.fetchResults();
      }
    );
  };

  applySuggestFilter = (result, stateVar, resultVar) => {
    let cat = result.category;
    let values = result[resultVar];
    if (values.constructor !== Array) {
      values = [values];
    }
    let allowedValues;
    this.setState(
      {
        [stateVar]: this.state[stateVar].concat(values),
        searchTags: this.state.searchTags.concat([
          {
            display: cat + ": " + result.title,
            key: stateVar,
            values: values
          }
        ])
      },
      () => this.setUrlLocation()
    );
  };

  handleSuggestSelect = (e, { result }) => {
    if (result.category == "Project") {
      this.handleProjectSelection(result.id);
    } else if (result.category == "Sample") {
      this.applySuggestFilter(result, "sampleIdsParams", "sample_ids");
    } else if (result.category == "Tissue") {
      this.applySuggestFilter(result, "selectedTissueFilters", "id");
    } else if (result.category == "Host") {
      this.applySuggestFilter(result, "selectedHostIndices", "id");
    } else if (result.category == "Location") {
      this.applySuggestFilter(result, "selectedLocations", "id");
    } else if (result.category == "Taxon") {
      this.applySuggestFilter(result, "selectedTaxids", "taxid");
    } else if (result.category == "Uploader") {
      this.applySuggestFilter(result, "selectedUploaderIds", "id");
    }
  };

  selectTissueFilter(tissues) {
    this.setState({ selectedTissueFilters: tissues }, () =>
      this.setUrlLocation()
    );
  }

  selectHostFilter(hosts) {
    this.setState({ selectedHostIndices: hosts }, () => this.setUrlLocation());
  }

  canEditProject(projectId) {
    return this.editableProjects.indexOf(parseInt(projectId)) > -1;
  }

  // TODO(mark): Rename function. Report progress display was removed.
  // But we still need to call checkReportDownload.
  displayReportProgress(res, status_action, retrieve_action) {
    setTimeout(() => {
      this.checkReportDownload(status_action, retrieve_action);
    }, 2000);
  }

  startReportGeneration(option) {
    let project_id = this.state.selectedProjectId
      ? this.state.selectedProjectId
      : "all";

    switch (option) {
      case "samples_table":
        openUrl(`/projects/${project_id}/csv`);
        break;
      case "project_reports":
        this.generateReport(
          "make_project_reports_csv",
          "project_reports_csv_status",
          "send_project_reports_csv"
        );
        break;
      case "host_gene_counts":
        this.generateReport(
          "make_host_gene_counts",
          "host_gene_counts_status",
          "send_host_gene_counts"
        );
        break;
      default:
        break;
    }
  }

  generateReport(makeAction, statusAction, retrieveAction) {
    this.nanobar.go(30);

    let url = `/projects/${this.state.selectedProjectId}/${makeAction}`;
    const bg_id = Cookies.get("background_id");
    if (bg_id) url += `?background_id=${bg_id}`;
    axios
      .get(url)
      .then(res => {
        this.setState({
          project_id_download_in_progress: this.state.selectedProjectId
        });
        this.displayReportProgress(res, statusAction, retrieveAction);
      })
      .catch(() => {});
  }

  checkReportDownload(status_action, retrieve_action) {
    axios
      .get(
        `/projects/${
          this.state.project_id_download_in_progress
        }/${status_action}`
      )
      .then(res => {
        let download_status = res.data.status_display;
        if (download_status === "complete") {
          openUrl(
            `/projects/${
              this.state.project_id_download_in_progress
            }/${retrieve_action}`
          );
          this.nanobar.go(100);
          this.setState({
            project_id_download_in_progress: null
          });
        } else {
          this.displayReportProgress(res, status_action, retrieve_action);
        }
      })
      .catch(() => {
        this.setState(
          {
            project_id_download_in_progress: null
          },
          () => {
            Materialize.toast(
              `Failed to download file for '${this.state.project.name}'`,
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

  fetchParams(param, asArray = false) {
    let urlParams = new URLSearchParams(window.location.search);
    let result = urlParams.get(param) || "";
    if (asArray) {
      result = result ? result.split(",") : [];
    }
    return result;
  }

  updateProjectUserState(user_array) {
    this.setState({ project_users: user_array });
  }

  fetchProjectUsers(id) {
    if (!id || !this.canEditProject(id)) {
      this.updateProjectUserState([]);
    } else {
      axios
        .get(`/projects/${id}/all_users.json`)
        .then(res => {
          this.updateProjectUserState(res.data.users);
        })
        .catch(() => {
          this.updateProjectUserState([]);
        });
    }
  }

  displayMetadataDropdown() {
    this.setState({
      displayDropdown: !this.state.displayDropdown
    });
  }

  updateUserDisplay(name_to_add, email_to_add) {
    let project_emails = this.state.project_users.map(user => user.email);
    if (!project_emails.includes(email_to_add)) {
      let new_project_users = this.state.project_users;
      new_project_users.push({ name: name_to_add, email: email_to_add });
      this.setState({ project_users: new_project_users });
    }
  }

  handleProjectPublished = () => {
    this.setState({
      project: Object.assign(this.state.project, {
        public_access: true
      })
    });
  };

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

  statusDisplay(status) {
    let statusClass;
    let statusIcon;
    switch (status) {
      case "WAITING":
        statusClass = "waiting";
        statusIcon = "fa fa-arrow-up";
        break;
      case "FAILED":
        statusClass = "failed";
        statusIcon = "fa fa-times";
        break;
      case "COMPLETE":
        statusClass = "complete";
        statusIcon = "fa fa-check";
        break;
      case "COMPLETE*":
        statusClass = "complete";
        statusIcon = "fa fa-check";
        break;
      default:
        statusClass = "uploading";
        statusIcon = "fa fa-repeat";
    }
    return (
      <div className={`${statusClass} status`}>
        <i className={`${statusClass} ${statusIcon}`} aria-hidden="true" />
        <span>{status}</span>
      </div>
    );
  }

  formatRunTime(runtime) {
    runtime = Number(runtime);
    const h = Math.floor(runtime / 3600);
    const m = Math.floor((runtime % 3600) / 60);

    const hDisplay = h > 0 ? h + (h === 1 ? " hour, " : " hours, ") : "";
    const mDisplay = m > 0 ? m + (m === 1 ? " minute" : " minutes") : "";
    return hDisplay + mDisplay;
  }

  renderPipelineOutput(samples) {
    return samples.map((sample, i) => {
      let dbSample = sample.db_sample;
      let runInfo = sample.run_info;
      let uploader = sample.uploader.name;
      let status = runInfo.result_status_description;

      const stageStatus = this.statusDisplay(status);

      const sample_name_info = (
        <SampleNameInfo parent={this} dbSample={dbSample} uploader={uploader} />
      );
      const data_values = getSampleTableData(sample);

      return (
        <PipelineOutputCards
          i={i}
          key={i}
          sample={sample}
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
          fetchedSamples: merge(
            prevState.fetchedSamples,
            keyBy(res.data.samples, "db_sample.id")
          ),
          fetchedSampleIds: [
            ...prevState.fetchedSampleIds,
            ...map(res.data.samples, "db_sample.id")
          ],
          pagesLoaded: prevState.pagesLoaded + 1,
          pageEnd: res.data.samples.length < this.pageSize
        }));
      })
      .catch(() => {
        this.setState({
          isRequesting: false
        });
      });
  }

  getParams() {
    let url_parts = window.location.href.split("?");
    let params = url_parts[url_parts.length - 1];
    return params;
  }

  hasFilters = () => {
    const fields = [
      "filterParams",
      "searchParams",
      "selectedHostIndices",
      "selectedTissueFilters",
      "selectedTaxids",
      "selectedLocations",
      "selectedUploaderIds",
      "sampleIdsParams"
    ];
    return fields.some(key => {
      return this.state[key].length > 0;
    });
  };

  allTissueTypes(all_tissues) {
    return all_tissues.length == 0 || all_tissues.indexOf("Not set") >= 0
      ? all_tissues
      : ["Not set", ...all_tissues];
  }

  // fetch results from filtering, search or switching projects
  // opt.resetFilters - should reset the filters
  // opt.projectChanged - project has just changed, so reset project stats
  fetchResults = (opts = {}) => {
    const { resetFilters, projectChanged } = opts;
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
          fetchedSamples: keyBy(res.data.samples, "db_sample.id"),
          fetchedSampleIds: map(res.data.samples, "db_sample.id"),
          tissueTypes: this.allTissueTypes(res.data.tissue_types),
          selectedTissueFilters:
            resetFilters || prevState.resetTissues
              ? []
              : prevState.selectedTissueFilters,
          hostGenomes: res.data.host_genomes,
          selectedHostIndices:
            resetFilters || prevState.resetHosts
              ? []
              : prevState.selectedHostIndices,
          displayEmpty: false,
          checkInUpdate: false, //don't trigger more update if it's from the fetchResults
          resetTissues: false,
          resetHosts: false,
          // Only change the total count if the project has changed.
          numTotalSamples: projectChanged
            ? res.data.count_project
            : prevState.numTotalSamples,
          // Only reset the selected ids if the project has changed.
          selectedSampleIds: projectChanged ? [] : prevState.selectedSampleIds,
          readySampleIdsForFilter: res.data.ready_sample_ids,
          numFilteredSamples: res.data.count,
          pagesLoaded: prevState.pagesLoaded + 1,
          pageEnd: res.data.samples.length < this.pageSize,
          isRequesting: false,
          areSamplesFiltered: this.hasFilters()
        }));
        if (!this.state.fetchedSampleIds.length) {
          this.setState({ displayEmpty: true });
        }
      })
      .catch(() => {
        this.setState(prevState => ({
          fetchedSamples: {},
          fetchedSampleIds: [],
          isRequesting: false,
          numTotalSamples: projectChanged ? 0 : prevState.numTotalSamples,
          // Only reset the selected ids if the project has changed.
          selectedSampleIds: projectChanged ? [] : prevState.selectedSampleIds,
          readySampleIdsForFilter: [],
          numFilteredSamples: 0,
          displayEmpty: true
        }));
      });
  };

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
      this.fetchResults({ resetFilters, projectChanged: true });
    } else {
      projId = parseInt(projId);
      axios
        .get(`projects/${projId}.json`)
        .then(res => {
          this.setState({
            project: res.data
          });
          this.fetchProjectUsers(projId);
          this.fetchResults({ resetFilters, projectChanged: true });
        })
        .catch(() => {
          this.setState({ project: null });
        });
    }
  }

  viewSample(id, currentEvent) {
    openUrl(`/samples/${id}`, currentEvent);
  }

  renderEmptyTable() {
    return (
      <div className="col s12 center-align empty-message">No results found</div>
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

  toggleAllSelectedSamples = e => {
    let selectedSampleIds = this.state.selectedSampleIds;
    const newChecked = e.target.checked;
    const readySampleIdsForFilter = this.state.readySampleIdsForFilter;

    const newSelectedSampleIds = newChecked
      ? union(selectedSampleIds, readySampleIdsForFilter)
      : difference(selectedSampleIds, readySampleIdsForFilter);

    this.setState({
      selectedSampleIds: newSelectedSampleIds
    });
  };

  compareSamples() {
    if (this.state.selectedSampleIds.length) {
      window.open(
        `/samples/heatmap?sampleIds=${this.state.selectedSampleIds}`,
        "_self"
      );
    }
  }

  handleCreateBackground(name, description, sample_ids) {
    var that = this;
    axios
      .post("/backgrounds", {
        name: name,
        description: description,
        sample_ids: sample_ids,
        authenticity_token: this.csrf
      })
      .then(response => {
        that.setState({
          background_creation_response: response.data
        });
      })
      .catch(error => {
        that.setState({
          background_creation_response: { message: "Something went wrong." }
        });
      });
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
        this.fetchResults({ resetFilters: true });
      }
    );
  }

  allReadySamplesSelected = () =>
    difference(this.state.readySampleIdsForFilter, this.state.selectedSampleIds)
      .length === 0;

  selectSample(e) {
    let sampleId = parseInt(e.target.getAttribute("data-sample-id"));

    const sampleList =
      e.target.getAttribute("data-checked") === "false"
        ? union(this.state.selectedSampleIds, [+sampleId])
        : difference(this.state.selectedSampleIds, [+sampleId]);

    // update the state with the new array of options
    this.setState({
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
        this.setUrlLocation();
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

  deleteProject() {
    let projectId = this.state.selectedProjectId;
    axios
      .delete(`/projects/${projectId}.json`, {
        data: { authenticity_token: this.csrf }
      })
      .then(_ => {
        openUrl("/");
      })
      .catch(err => {});
  }

  renderTable(sampleMap, sampleIds) {
    let project_id = this.state.selectedProjectId
      ? this.state.selectedProjectId
      : "all";
    let search_field = (
      <TableSearchField searchParams={this.state.searchParams} parent={this} />
    );

    const samples = sampleIds.map(id => sampleMap[id]);

    const downloadOptions = [{ text: "Samples Table", value: "samples_table" }];
    if (project_id !== "all") {
      downloadOptions.push({ text: "Reports", value: "project_reports" });
      if (this.admin === 1) {
        downloadOptions.push({
          text: "Host Gene Counts",
          value: "host_gene_counts"
        });
      }
    }
    let table_download_dropdown = (
      <div className="button-container">
        <DownloadButtonDropdown
          options={downloadOptions}
          onClick={this.startReportGeneration}
        />
      </div>
    );

    let compareButton = (
      <div className="button-container">
        <CompareButton
          disabled={this.state.selectedSampleIds.length < 1}
          onClick={this.compareSamples}
        />
      </div>
    );

    let delete_project_button = (
      <div className="button-container">
        <SecondaryButton text="Delete Project" onClick={this.deleteProject} />
      </div>
    );

    let search_tag_list;
    if (this.admin !== 0 || this.allowedFeatures.includes("structuredSearch")) {
      search_tag_list = this.state.searchTags.map((entry, i) => {
        return (
          <FilterTag
            text={entry.display}
            onClose={e => this.removeFilterTag(entry, i)}
            key={`filter-tag-${i}`}
          />
        );
      });
    } else {
      search_tag_list = [
        this.generateTagList(
          "hostGenomes",
          "selectedHostIndices",
          "Host: ",
          "id",
          "name",
          "int"
        ),
        this.generateTagList(
          "tissueTypes",
          "selectedTissueFilters",
          "Sample Type: "
        )
      ];
    }

    const search_box =
      this.admin !== 0 || this.allowedFeatures.includes("structuredSearch") ? (
        <div className="row search-box-row">
          <CategorySearchBox
            serverSearchAction="search_suggestions"
            onResultSelect={this.handleSuggestSelect}
            onEnter={this.handleSearch}
            initialValue=""
            placeholder=""
          />
        </div>
      ) : (
        <div className="row search-box-row">
          <div className="search-box">{search_field}</div>
          <div className="filter-container">
            <MultipleDropdown
              label="Hosts:"
              disabled={this.state.hostGenomes.length == 0}
              options={this.state.hostGenomes.map(host => {
                return { text: host.name, value: host.id };
              })}
              value={this.state.selectedHostIndices}
              onChange={this.selectHostFilter}
              rounded
            />
          </div>
          <div className="filter-container">
            <MultipleDropdown
              label="Sample Types:"
              disabled={this.state.tissueTypes.length == 0}
              options={this.state.tissueTypes.map(tissue => {
                return { text: tissue, value: tissue };
              })}
              value={this.state.selectedTissueFilters}
              onChange={this.selectTissueFilter}
              rounded
            />
          </div>
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

    const projInfo = (
      <ProjectInfoHeading
        proj={proj}
        project_menu={project_menu}
        table_download_dropdown={table_download_dropdown}
        compare_button={compareButton}
        delete_project_button={delete_project_button}
        parent={this}
        state={this.state}
        canEditProject={this.canEditProject}
        selectedSampleIds={this.state.selectedSampleIds}
        numTotalSamples={this.state.numTotalSamples}
      />
    );

    const tableHead = (
      <TableColumnHeaders
        sort={this.state.sort_by}
        onStatusFilterSelect={this.handleStatusFilterSelect}
        hasStatusFilter={
          this.state.filterParams.length > 0 &&
          this.state.filterParams !== "All"
        }
        state={this.state}
        parent={this}
      />
    );

    return (
      <FilterListMarkup
        projInfo={projInfo}
        search_box={search_box}
        search_tag_list={search_tag_list}
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

      let searchFilterChange = [
        "sampleIdsParams",
        "selectedTaxids",
        "selectedLocations",
        "selectedUploaderIds"
      ].some(param => {
        return prevState[param].toString() !== this.state[param].toString();
      });

      if (
        this.state.hostFilterChange ||
        this.state.tissueFilterChange ||
        searchFilterChange
      ) {
        this.setUrlLocation();
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
    this.checkPublicSamples();
  }

  displayPublicSampleNotifications(samplesGoingPublic) {
    let previouslyDismissedSamples = new Set();
    try {
      previouslyDismissedSamples = new Set(
        JSON.parse(localStorage.getItem("dismissedPublicSamples"))
      );
    } catch (_) {
      // catch and ignore possible old formats
    }

    let [dismissedSamples, newSamples] = partition(samplesGoingPublic, sample =>
      previouslyDismissedSamples.has(sample.id)
    );
    if (newSamples.length > 0) {
      localStorage.setItem(
        "dismissedPublicSamples",
        JSON.stringify(map(dismissedSamples, "id"))
      );
      publicSampleNotificationsByProject(newSamples);
    }
  }

  checkPublicSamples() {
    axios.get("/samples/samples_going_public.json").then(res => {
      if ((res.data || []).length) {
        this.displayPublicSampleNotifications(res.data);
      }
    });
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
  handleStatusFilterSelect = status => {
    this.setState(
      {
        filterParams: status
      },
      () => {
        this.setUrlLocation();
        this.fetchResults();
      }
    );
  };

  selectionToParamsOrNone(selected_options, value_when_empty = "") {
    return selected_options.length == 0
      ? value_when_empty
      : selected_options.join(",");
  }

  //set Url based on requests
  setUrlLocation(value_when_empty = "") {
    let projectId = parseInt(this.state.selectedProjectId);
    const params = {
      project_id: projectId ? projectId : null,
      filter: this.state.filterParams,
      tissue: this.selectionToParamsOrNone(this.state.selectedTissueFilters),
      host: this.selectionToParamsOrNone(this.state.selectedHostIndices),
      search: this.state.searchParams,
      ids: this.selectionToParamsOrNone(this.state.sampleIdsParams),
      taxid: this.selectionToParamsOrNone(this.state.selectedTaxids),
      location: this.selectionToParamsOrNone(this.state.selectedLocations),
      uploader: this.selectionToParamsOrNone(this.state.selectedUploaderIds),
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
        tissueTypes: [],
        hostGenomes: [],
        // clear all filters
        searchTags: [],
        sampleIdsParams: [],
        selectedTissueFilters: [],
        selectedHostIndices: [],
        selectedLocations: [],
        selectedTaxids: [],
        selectedUploaderIds: []
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
        selectedProjectId={this.state.selectedProjectId}
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
          {this.renderTable(
            this.state.fetchedSamples,
            this.state.fetchedSampleIds
          )}
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

function ColumnDropdownHeader({
  pos,
  column_name,
  onStatusFilterSelect,
  hasStatusFilter,
  columnsShown,
  parent
}) {
  const columnOptions = sortBy(
    column => SAMPLE_TABLE_COLUMNS[column].display_name,
    difference(ALL_COLUMNS, columnsShown)
  );
  return (
    <li key={column_name} className="header">
      <TableColumnHeader
        className="card-label column-title center-label sample-name center menu-dropdown"
        columnName={column_name}
        displayName={SAMPLE_TABLE_COLUMNS[column_name].display_name}
        tooltip={SAMPLE_TABLE_COLUMNS[column_name].tooltip}
        columnMap={SAMPLE_TABLE_COLUMNS}
        columnOptions={columnOptions}
        onColumnOptionSelect={newColumn => parent.switchColumn(newColumn, pos)}
      />
      {column_name === "pipeline_status" && (
        <PipelineStatusFilter
          onStatusFilterSelect={onStatusFilterSelect}
          className={cx("pipeline-status-filter", hasStatusFilter && "active")}
        />
      )}
    </li>
  );
}

function FilterListMarkup({
  projInfo,
  search_box,
  host_filter_tag_list,
  tissue_filter_tag_list,
  search_tag_list,
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
          {host_filter_tag_list} {tissue_filter_tag_list} {search_tag_list}
        </div>
        <div className={cs.statusLabels}>
          {parent.state.areSamplesFiltered && (
            <span className={cs.label}>
              {parent.state.numFilteredSamples} samples matching filters
            </span>
          )}
          {parent.state.selectedSampleIds.length > 0 && (
            <span className={cs.label}>
              {parent.state.selectedSampleIds.length} samples selected
            </span>
          )}
        </div>
        <div className="sample-table-container row">
          {tableHead}
          {!samples.length && parent.state.displayEmpty
            ? parent.renderEmptyTable()
            : parent.renderPipelineOutput(samples)}
        </div>
      </div>
      {!parent.state.pageEnd && parent.state.fetchedSampleIds.length > 14 ? (
        <div className="scroll">
          <i className="fa fa-spinner fa-spin fa-3x" />
        </div>
      ) : (
        ""
      )}
    </div>
  );
}

function SampleNameInfo({ parent, dbSample, uploader }) {
  return (
    <div
      onClick={e => parent.viewSample(dbSample.id, e)}
      className="sample-name-info"
    >
      <BasicPopup
        trigger={
          <div className="card-label center-label sample-name bold-label">
            {dbSample.name}
          </div>
        }
        content={dbSample.name}
        size="mini"
        wide="very"
      />
      <div className="card-label author bottom-label">
        <span className="upload-date">
          {moment(dbSample.created_at)
            .startOf("second")
            .fromNow()}
        </span>
        {!uploader || uploader === "" ? "" : <span>{` | ${uploader}`}</span>}
      </div>
    </div>
  );
}

function PipelineOutputCards({
  i,
  sample,
  report_ready,
  sample_name_info,
  stageStatus,
  total_runtime,
  data_values,
  parent
}) {
  let dbSample = sample.db_sample;
  return (
    <a className="col s12 no-padding sample-feed" key={i}>
      <div>
        <div className="samples-card white">
          <div className="flex-container">
            <ul className="flex-items">
              <SampleCardCheckboxes
                sample={sample}
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

class BackgroundModal extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      modalOpen: false,
      name: "",
      description: ""
    };
    this.handleOpen = this.handleOpen.bind(this);
    this.handleClose = this.handleClose.bind(this);
    this.handleChange = this.handleChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
    this.renderTextField = this.renderTextField.bind(this);
    this.renderSampleList = this.renderSampleList.bind(this);
  }

  renderSampleList() {
    const MAX_SAMPLES_TO_SHOW = 10;

    const availableSampleIds = intersection(
      this.props.selectedSampleIds,
      this.props.parent.state.fetchedSampleIds
    );

    const samplesToShow = map(
      take(availableSampleIds, MAX_SAMPLES_TO_SHOW),
      id => this.props.parent.state.fetchedSamples[id]
    );

    const getSampleAttribute = this.props.parent.getSampleAttribute;

    const getSampleDetails = sample => {
      const projectId = getSampleAttribute(sample, "project_id");
      const pipelineRunId = getSampleAttribute(sample, "pipeline_run_id");
      return ` (project_id: ${projectId}, pipeine_run_id: ${pipelineRunId})`;
    };

    const samplesRemaining =
      this.props.selectedSampleIds.length - samplesToShow.length;

    return (
      <div className={cx("background-modal-contents", cs.sampleList)}>
        <div className="label-text">Selected samples:</div>
        <div className={cs.warning}>
          <i className="fa fa-exclamation-triangle" />
          A large number of samples may increase the processing time before your
          collection can be used as a background.
        </div>
        <ul className={cs.selectedSamples}>
          {samplesToShow.map(sample => (
            <li key={sample.db_sample.id}>
              <span>
                {getSampleAttribute(sample, "name")}
                {this.props.parent.admin && (
                  <span className="secondary-text">
                    {getSampleDetails(sample)}
                  </span>
                )}
              </span>
            </li>
          ))}
        </ul>
        {samplesRemaining > 0 && (
          <div className={cs.moreSamplesCount}>
            and {samplesRemaining} more...
          </div>
        )}
      </div>
    );
  }

  handleOpen() {
    this.setState({
      modalOpen: true,
      name: "",
      description: ""
    });
    this.props.parent.setState({
      background_creation_response: {}
    });
  }
  handleClose() {
    this.sample_names = [];
    this.setState({
      modalOpen: false,
      name: "",
      description: ""
    });
  }
  handleChange(e, { name, value }) {
    this.setState({ [e.target.id]: value });
  }
  handleSubmit() {
    this.props.parent.handleCreateBackground(
      this.state.new_background_name,
      this.state.new_background_description,
      this.props.parent.state.selectedSampleIds
    );
  }
  renderTextField(label, optional, id, rows) {
    return (
      <div className="background-modal-contents">
        <div className="label-text">
          {label}
          <span className="secondary-text">{optional ? " Optional" : ""}</span>
        </div>
        <Form.TextArea
          autoHeight
          className={`col s12 browser-default`}
          rows={rows}
          id={id}
          onChange={this.handleChange}
        />
      </div>
    );
  }

  render() {
    let background_creation_response = this.props.parent.state
      .background_creation_response;
    return (
      <Modal
        trigger={
          <div className="button-container">
            <PrimaryButton
              text="Create Collection"
              onClick={this.handleOpen}
              disabled={!this.props.selectedSampleIds.length}
            />
          </div>
        }
        open={this.state.modalOpen}
        onClose={this.handleClose}
        className="modal project-popup add-user-modal"
      >
        <Modal.Header className="project_modal_header">
          Create a Collection
        </Modal.Header>
        <Modal.Content className="modal-content">
          <div>
            A collection is a group of samples. You can use this collection as a
            background model to be selected on a sample report page. It{"'"}ll
            update the calculated z-score to indicate how much the the sample
            deviates from the norm for that collection.
          </div>
          <Form onSubmit={this.handleSubmit}>
            {this.renderTextField("Name", false, "new_background_name", 1)}
            {this.renderTextField(
              "Description",
              true,
              "new_background_description",
              7
            )}
            {this.renderSampleList()}
            <div className="background-button-section">
              <PrimaryButton text="Create" type="submit" />
              <SecondaryButton text="Cancel" onClick={this.handleClose} />
            </div>
          </Form>
          {background_creation_response.status === "ok" ? (
            <div className="status-message status teal-text text-darken-2">
              <i className="fa fa-smile-o fa-fw" />
              Collection is being created and will be visible on the report page
              once statistics have been computed.
            </div>
          ) : background_creation_response.message ? (
            <div className="status-message">
              <i className="fa fa-close fa-fw" />
              {background_creation_response.message.join("; ")}
            </div>
          ) : null}
        </Modal.Content>
      </Modal>
    );
  }
}

function ProjectHeaderMenu({ proj, proj_users_count, parent }) {
  const showUploadMenu =
    (parent.admin !== 0 ||
      parent.allowedFeatures.includes("project_metadata_upload")) &&
    (proj && parent.canEditProject(proj.id));

  const currentTimestamp = moment();
  const nextPublicSampleTimestamp = min(
    Object.values(parent.state.fetchedSamples)
      .map(sample => moment(sample.db_sample.private_until))
      .filter(timestamp => timestamp >= currentTimestamp)
  );
  const nextPublicSampleDate = nextPublicSampleTimestamp
    ? nextPublicSampleTimestamp.format("MMM Do, YYYY")
    : null;

  return (
    <div className={cs.projectMenu}>
      <div className={cs.fillIn} />
      {proj &&
        (proj.public_access ? (
          <div className={cs.projectMenuItem}>
            <GlobeIcon className={cs.smallIcon} /> Public project
          </div>
        ) : (
          <div className={cs.projectMenuItem}>
            <LockIcon className={cs.smallIcon} /> Private project
          </div>
        ))}
      {proj &&
        parent.canEditProject(proj.id) && (
          <div className={cs.projectMenuItem}>
            <UserIcon className={cx(cs.smallIcon, cs.smallIconUser)} />{" "}
            {proj_users_count
              ? `${parent.state.project_users.length} member${
                  parent.state.project_users.length > 1 ? "s" : ""
                }`
              : "No members"}
          </div>
        )}
      {proj &&
        parent.canEditProject(proj.id) && (
          <div className={cs.projectMenuItem}>
            <ProjectSettingsModal
              csrf={parent.csrf}
              nextPublicSampleDate={nextPublicSampleDate}
              onUserAdded={parent.updateUserDisplay}
              onProjectPublished={parent.handleProjectPublished}
              project={proj}
              users={parent.state.project_users}
            />
          </div>
        )}

      {/* TODO(mark): Change admin to canEditProject when launch */}
      {showUploadMenu && (
        <div className={cs.projectMenuItem}>
          <ProjectUploadMenu project={proj} />
        </div>
      )}
    </div>
  );
}

function ProjectInfoHeading({
  proj,
  project_menu,
  table_download_dropdown,
  compare_button,
  delete_project_button,
  parent,
  state,
  canEditProject,
  selectedSampleIds,
  numTotalSamples
}) {
  const handlePhyloModalOpen = () => {
    parent.setState({ phyloTreeCreationModalOpen: true });
  };

  const handlePhyloModalClose = () => {
    parent.setState({ phyloTreeCreationModalOpen: false });
  };

  let phyloProps = {
    admin: parseInt(parent.admin),
    csrf: parent.csrf
  };

  let phyloModalTrigger = (
    <div className="button-container">
      <PhylogenyButton onClick={handlePhyloModalOpen} />
    </div>
  );

  return (
    <div className="row download-section">
      <div className="col s5 wrapper proj-title-container">
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
          {numTotalSamples === 0
            ? "No samples found"
            : `${numTotalSamples} total sample${
                numTotalSamples > 1 ? "s" : ""
              }`}
        </p>
      </div>
      <div className="col s7 download-section-btns">
        {state.selectedProjectId ? project_menu : null}
        <div className="buttons-row">
          {table_download_dropdown}
          {phyloModalTrigger}
          {compare_button}
          <BackgroundModal
            parent={parent}
            selectedSampleIds={selectedSampleIds}
          />
          {state.selectedProjectId &&
          canEditProject(state.selectedProjectId) &&
          state.project &&
          state.project.total_sample_count == 0
            ? delete_project_button
            : null}
        </div>
      </div>
      {state.phyloTreeCreationModalOpen && (
        <PhyloTreeCreationModal
          {...phyloProps}
          onClose={handlePhyloModalClose}
        />
      )}
    </div>
  );
}

function TableColumnHeaders({
  sort,
  onStatusFilterSelect,
  hasStatusFilter,
  state,
  parent
}) {
  return (
    <div className="col s12 sample-feed-head no-padding samples-table-head">
      <div className="samples-card white">
        <div className="flex-container">
          <ul className="flex-items">
            <li className={cs.nameHeader}>
              {parent.state.displaySelectSamples &&
                parent.state.readySampleIdsForFilter.length > 0 && (
                  <div className={cs.checkAllContainer}>
                    <input
                      type="checkbox"
                      id="checkAll"
                      className="filled-in checkAll"
                      checked={parent.allReadySamplesSelected()}
                      onClick={parent.toggleAllSelectedSamples}
                    />
                    <label htmlFor="checkAll" />
                  </div>
                )}
              <div className="card-label column-title center-label sample-name">
                <div className="sort-able" onClick={parent.sortSamples}>
                  <span className={cs.sampleNameHeader}>Name</span>
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

            {state.columnsShown.map((columnName, pos) => {
              return (
                <ColumnDropdownHeader
                  pos={pos}
                  key={pos}
                  column_name={columnName}
                  onStatusFilterSelect={onStatusFilterSelect}
                  hasStatusFilter={hasStatusFilter}
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

function SampleCardCheckboxes({
  sample,
  report_ready,
  sample_name_info,
  i,
  parent
}) {
  const checked =
    parent.state.selectedSampleIds.indexOf(sample.db_sample.id) >= 0;
  return (
    <li className="check-box-container">
      {parent.state.displaySelectSamples ? (
        <div>
          <input
            type="checkbox"
            id={i}
            key={`sample_${sample.db_sample.id}`}
            className="filled-in checkbox"
            checked={checked}
            disabled={report_ready != 1}
          />
          <label
            data-checked={checked}
            onClick={parent.selectSample}
            data-sample-id={sample.db_sample.id}
          >
            <div onClick={e => e.stopPropagation()}>{sample_name_info}</div>
          </label>
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
  const blankCell = <span className="blank">--</span>;
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
          <div className="card-label center center-label data-label bold-label">
            {data_values[column] || blankCell}
          </div>
          <div className="card-label center center-label data-label data-label-percent">
            {data_values["nonhost_reads_percent"] && (
              <span className="percent">
                {data_values["nonhost_reads_percent"]}
              </span>
            )}
          </div>
        </li>
      );
    } else {
      column_data = (
        <li key={pos} onClick={parent.viewSample.bind(parent, dbSample.id)}>
          <div className="card-label center center-label data-label bold-label">
            {data_values[column] || blankCell}
          </div>
        </li>
      );
    }
    return column_data;
  });
}

export default Samples;
