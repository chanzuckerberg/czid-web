import React from "react";
import PropTypes from "prop-types";
import UrlQueryParser from "~/components/utils/UrlQueryParser";
import moment from "moment";
import {
  capitalize,
  clone,
  compact,
  concat,
  escapeRegExp,
  find,
  getOr,
  isEmpty,
  keyBy,
  map,
  mapKeys,
  mapValues,
  merge,
  partition,
  pick,
  replace,
  sumBy,
  union,
  values,
  xor,
  xorBy,
} from "lodash/fp";

import { getSearchSuggestions } from "~/api";
import { logAnalyticsEvent } from "~/api/analytics";
import { get } from "~/api/core";
import { UserContext } from "~/components/common/UserContext";
import { Divider } from "~/components/layout";
import NarrowContainer from "~/components/layout/NarrowContainer";
import { CG_BULK_DOWNLOADS_FEATURE } from "~/components/utils/features";
import { WORKFLOWS, WORKFLOW_ORDER } from "~/components/utils/workflows";
import { MAP_CLUSTER_ENABLED_LEVELS } from "~/components/views/discovery/mapping/constants";
import { indexOfMapLevel } from "~/components/views/discovery/mapping/utils";
import { publicSampleNotificationsByProject } from "~/components/views/samples/notifications";
import { DEFAULTS_BY_WORKFLOW } from "~/components/views/samples/SamplesView/ColumnConfiguration";
import Tabs from "~ui/controls/Tabs";
import BannerProjects from "~ui/icons/BannerProjects";
import BannerSamples from "~ui/icons/BannerSamples";
import BannerVisualizations from "~ui/icons/BannerVisualizations";
import { VISUALIZATIONS_DOC_LINK } from "~utils/documentationLinks";
import { openUrl } from "~utils/links";

import DiscoveryHeader from "./DiscoveryHeader";
import ModalFirstTimeUser from "./ModalFirstTimeUser";
import ProjectsView from "../projects/ProjectsView";
import SamplesView from "../samples/SamplesView/SamplesView";
import VisualizationsView from "../visualizations/VisualizationsView";
import DiscoverySidebar from "./DiscoverySidebar";
import DiscoveryFilters from "./DiscoveryFilters";
import { DiscoveryDataLayer } from "./DiscoveryDataLayer";
import ProjectHeader from "./ProjectHeader";
import {
  getDiscoveryDimensions,
  getDiscoveryStats,
  getDiscoveryLocations,
  DISCOVERY_DOMAINS,
  DISCOVERY_DOMAIN_ALL_DATA,
  DISCOVERY_DOMAIN_MY_DATA,
  DISCOVERY_DOMAIN_PUBLIC,
  DISCOVERY_DOMAIN_SNAPSHOT,
} from "./discovery_api";
import InfoBanner from "./InfoBanner";
import MapPreviewSidebar from "./mapping/MapPreviewSidebar";

import cs from "./discovery_view.scss";

// Data available
// (A) non-filtered dimensions: for filter options
// (B) filtered dimensions: for sidebar
// (C) filtered stats
// (D) synchronous data: for projects and visualization tables
// (E) asynchronous data: for samples, triggered on demand by infinite table
// Data workflow
// * Initial load:
//   - load (A) non-filtered dimensions, (C) filtered stats and (D) synchronous table data
//   * if filter or project is set
//     - load (B) filtered dimensions and (C) filtered stats
// * On filter change:
//   - load (B) filtered dimensions, (C) filtered stats
//     * if project not set
//       load (D) synchronous table data
// * On project selected
//   - load (A) non-filtered dimensions, (B) filtered dimensions and (C) filtered stats
//     (synchronous data not needed for now because we do not show projects and visualizations)
class DiscoveryView extends React.Component {
  constructor(props, context) {
    super(props, context);

    const { projectId, domain } = this.props;

    this.urlParser = new UrlQueryParser({
      filters: "object",
      projectId: "number",
      showFilters: "boolean",
      showStats: "boolean",
    });

    const urlState = this.urlParser.parse(location.search);
    let sessionState = this.loadState(sessionStorage, "DiscoveryViewOptions");
    let localState = this.loadState(localStorage, "DiscoveryViewOptions");

    // values are copied from left to right to the first argument (last arguments override previous)
    this.state = Object.assign(
      {
        currentDisplay: "table",
        currentTab:
          projectId || domain === DISCOVERY_DOMAIN_ALL_DATA
            ? "samples"
            : "projects",
        emptyStateModalOpen: this.isFirstTimeUser(),
        filteredProjectCount: null,
        filteredProjectDimensions: [],
        filteredSampleCount: null,
        filteredSampleDimensions: [],
        filteredSampleStats: {},
        filteredVisualizationCount: null,
        filters: {},
        loadingDimensions: true,
        loadingLocations: true,
        loadingStats: true,
        mapLevel: "country",
        mapLocationData: {},
        mapPreviewedLocationId: null,
        mapSidebarProjectCount: null,
        mapSidebarProjectDimensions: [],
        mapSidebarSampleCount: null,
        mapSidebarSampleDimensions: [],
        mapSidebarSampleStats: {},
        mapSidebarTab: "summary",
        project: null,
        projectDimensions: [],
        projectId: projectId,
        rawMapLocationData: {},
        sampleActiveColumnsByWorkflow: undefined,
        sampleDimensions: [],
        search: null,
        selectableSampleIds: [],
        selectedSampleIds: {
          [WORKFLOWS.SHORT_READ_MNGS.value]: new Set(),
          [WORKFLOWS.CONSENSUS_GENOME.value]: new Set(),
        },
        showFilters: true,
        showStats: true,
        userDataCounts: null,
        workflow: WORKFLOWS.SHORT_READ_MNGS.value,
      },
      localState,
      sessionState,
      urlState
    );

    // If a user had previously selected the PLQC view for a specific project,
    // ensure that currentDisplay defaults to "table" if they switch to a different view,
    // since the PLQC display only exists when viewing a single project.
    if (this.state.currentDisplay === "plqc" && !projectId) {
      this.state.currentDisplay = "table";
    }
    if (!this.state.sampleActiveColumnsByWorkflow) {
      this.state.sampleActiveColumnsByWorkflow = DEFAULTS_BY_WORKFLOW;
    }

    this.dataLayer = new DiscoveryDataLayer(domain);
    const conditions = this.getConditions();
    this.samples = this.dataLayer.samples.createView({
      conditions,
      onViewChange: this.refreshSampleData,
      displayName: "SamplesViewBase",
    });
    this.projects = this.dataLayer.projects.createView({
      conditions,
      onViewChange: this.refreshProjectData,
      displayName: "ProjectsViewBase",
    });
    this.visualizations = this.dataLayer.visualizations.createView({
      conditions,
      onViewChange: this.refreshVisualizationData,
      displayName: "VisualizationsViewBase",
    });
    this.mapPreviewProjects = this.projects;
    this.mapPreviewSamples = this.samples;

    this.samplesByWorkflow = this.constructSamplesByWorkflow();

    // hold references to the views to allow resetting the tables
    this.projectsView = null;
    this.samplesView = null;
    this.mapPreviewSidebar = null;

    // preload first pages
    domain !== DISCOVERY_DOMAIN_SNAPSHOT && this.projects.loadPage(0);
    this.samples.loadPage(0);
    domain !== DISCOVERY_DOMAIN_SNAPSHOT && this.visualizations.loadPage(0);

    this.updateBrowsingHistory("replace");
  }

  // Special case to support per-workflow tab views
  constructSamplesByWorkflow = () => {
    const result = {};
    WORKFLOW_ORDER.forEach(name => {
      const workflow = WORKFLOWS[name].value;
      const conditions = this.getConditions();
      conditions.filters.workflow = workflow;

      result[workflow] = this.dataLayer.samples.createView({
        conditions,
        onViewChange: this.refreshSampleData,
        displayName: workflow,
      });
      result[workflow].loadPage(0);
    });
    return result;
  };

  async componentDidMount() {
    const { domain } = this.props;

    this.initialLoad();
    domain !== DISCOVERY_DOMAIN_SNAPSHOT && this.checkPublicSamples();

    window.onpopstate = () => {
      this.setState(history.state, () => {
        this.resetData({
          callback: this.initialLoad,
        });
      });
    };
  }

  loadState = (store, key) => {
    try {
      return JSON.parse(store.getItem(key)) || {};
    } catch (e) {
      // Avoid possible bad transient state related crash
      // eslint-disable-next-line no-console
      console.warn(`Bad state: ${e}`);
    }
    return {};
  };

  updateBrowsingHistory = (action = "push") => {
    const { domain, snapshotShareId } = this.props;

    const localFields = [
      "sampleActiveColumnsByWorkflow",
      "showFilters",
      "showStats",
    ];

    const sessionFields = concat(localFields, [
      "currentDisplay",
      "mapSidebarTab",
      "workflow",
    ]);
    const urlFields = concat(sessionFields, [
      "currentTab",
      "filters",
      "projectId",
      "search",
      // Omit sampleActiveColumnsByWorkflow from URL b/c it's too large
    ]).filter(key => key !== "sampleActiveColumnsByWorkflow");
    const stateFields = concat(urlFields, ["project"]);

    const localState = pick(localFields, this.state);
    const sessionState = pick(sessionFields, this.state);
    const urlState = pick(urlFields, this.state);
    const historyState = pick(stateFields, this.state);

    // Saving on URL enables sharing current view with other users
    let urlQuery = this.urlParser.stringify(urlState);
    if (urlQuery) {
      urlQuery = `?${urlQuery}`;
    }
    let prefix = snapshotShareId ? this.getSnapshotPrefix() : `/${domain}`;

    // History state may include some small fields that enable direct loading of previous pages
    // from browser history without having to request those fields from server (e.g. project)
    if (action === "push") {
      history.pushState(
        historyState,
        `DiscoveryView:${domain}`,
        `${prefix}${urlQuery}`
      );
    } else {
      history.replaceState(
        historyState,
        `DiscoveryView:${domain}`,
        `${prefix}${urlQuery}`
      );
    }

    // We want to persist all options when user navigates to other pages within the same session
    sessionStorage.setItem(
      "DiscoveryViewOptions",
      JSON.stringify(sessionState)
    );

    // We want to persist some options when user returns to the page on a different session
    localStorage.setItem("DiscoveryViewOptions", JSON.stringify(localState));

    // Track changes to the page that did not cause a page load but the URL was updated
    // Used specifically to notify Appcues
    if (window.analytics) {
      window.analytics.page();
    }
  };

  isFirstTimeUser = () => {
    const { firstSignIn } = this.context || {};
    return firstSignIn && !localStorage.getItem("DiscoveryViewSeenBefore");
  };

  preparedFilters = () => {
    const { filters } = this.state;
    let preparedFilters = mapKeys(replace("Selected", ""), filters);

    // Time is an exception: we translate values into date ranges
    if (preparedFilters.time) {
      const startDate = {
        "1_week": () => moment().subtract(7, "days"),
        "1_month": () => moment().subtract(1, "months"),
        "3_month": () => moment().subtract(3, "months"),
        "6_month": () => moment().subtract(6, "months"),
        "1_year": () => moment().subtract(1, "years"),
      };

      preparedFilters.time = [
        startDate[preparedFilters.time]().format("YYYYMMDD"),
        moment()
          .add(1, "days")
          .format("YYYYMMDD"),
      ];
    }

    // Taxon is an exception: this filter needs to store complete option, so need to convert to values only
    if (preparedFilters.taxon && preparedFilters.taxon.length) {
      preparedFilters.taxon = map("value", preparedFilters.taxon);
    }

    return preparedFilters;
  };

  resetData = ({ callback } = {}) => {
    const { domain } = this.props;
    const conditions = this.getConditions();

    this.samples.reset({ conditions, loadFirstPage: true });
    for (const [name, view] of Object.entries(this.samplesByWorkflow)) {
      const conditions = this.getConditions();
      conditions.filters.workflow = name;
      view.reset({ conditions, loadFirstPage: true });
    }
    if (domain !== DISCOVERY_DOMAIN_SNAPSHOT) {
      this.projects.reset({ conditions, loadFirstPage: true });
      this.visualizations.reset({ conditions, loadFirstPage: true });
    }
    if (this.mapPreviewSamples !== this.samples) {
      this.mapPreviewSamples.reset({ conditions, loadFirstPage: true });
    }
    if (this.mapPreviewProjects !== this.projects) {
      this.mapPreviewProjects.reset({ conditions, loadFirstPage: true });
    }

    this.setState(
      {
        filteredProjectCount: null,
        filteredProjectDimensions: [],
        filteredSampleCount: null,
        filteredSampleDimensions: [],
        filteredVisualizationCount: null,
        filteredSampleStats: {},
        loadingDimensions: true,
        mapSidebarProjectCount: null,
        mapSidebarSampleCount: null,
        mapSidebarSampleStats: null,
      },
      () => {
        this.samplesView && this.samplesView.reset();
        this.projectsView && this.projectsView.reset();
        callback && callback();
      }
    );
  };

  initialLoad = () => {
    const { project } = this.state;
    const { domain } = this.props;

    domain !== DISCOVERY_DOMAIN_SNAPSHOT && this.loadUserDataStats();
    // * Initial load:
    //   - load (A) non-filtered dimensions, (C) filtered stats, (D) filtered locations, and (E) synchronous table data
    this.refreshDimensions();
    this.refreshFilteredStats();
    if (domain !== DISCOVERY_DOMAIN_SNAPSHOT) {
      this.refreshFilteredLocations();
    }
    //   * if filter or project is set
    //     - load (B) filtered dimensions
    (this.getFilterCount() || project) && this.refreshFilteredDimensions();
  };

  resetDataFromFilterChange = () => {
    const { domain } = this.props;
    this.resetData({
      callback: () => {
        // * On filter change:
        //   - load (B) filtered dimensions, (C) filtered stats, (D) filtered locations
        this.refreshFilteredDimensions();
        this.refreshFilteredStats();
        if (domain !== DISCOVERY_DOMAIN_SNAPSHOT) {
          this.refreshFilteredLocations();
          this.refreshSelectedPLQCSamples();
        }
      },
    });
  };

  refreshDataFromProjectChange = () => {
    this.resetData({
      callback: () => {
        // * On project selected
        //   - load (A) non-filtered dimensions, (B) filtered dimensions and (C) filtered stats
        //     (synchronous data not needed for now because we do not show projects and visualizations)
        this.loadUserDataStats();
        this.refreshDimensions();
        this.refreshFilteredDimensions();
        this.refreshFilteredStats();
        this.refreshFilteredLocations();
      },
    });
  };

  refreshDimensions = async () => {
    const { domain, snapshotShareId } = this.props;
    const { projectId } = this.state;

    this.setState({
      loadingDimensions: true,
    });

    const {
      projectDimensions,
      sampleDimensions,
    } = await getDiscoveryDimensions({
      domain,
      projectId,
      snapshotShareId,
    });

    this.setState({
      projectDimensions,
      sampleDimensions,
      loadingDimensions: false,
    });
  };

  refreshFilteredStats = async () => {
    const { domain, snapshotShareId } = this.props;
    const { projectId, search } = this.state;

    this.setState({
      loadingStats: true,
    });

    const { sampleStats: filteredSampleStats } = await getDiscoveryStats({
      domain,
      projectId,
      snapshotShareId,
      filters: this.preparedFilters(),
      search,
    });

    this.setState({
      filteredSampleStats,
      loadingStats: false,
    });
  };

  refreshProjectData = () => {
    const { projectId } = this.state;

    this.setState({
      filteredProjectCount: this.projects.length,
      project: this.projects.get(projectId),
    });
  };

  refreshSampleData = () => {
    const { workflow } = this.state;
    this.setState({
      filteredSampleCount: this.samples.length,
      selectableSampleIds: this.samplesByWorkflow[workflow].getIds(),
    });
  };

  refreshVisualizationData = () => {
    this.setState({
      filteredVisualizationCount: this.visualizations.length,
    });
  };

  refreshMapSidebarProjectData = () => {
    this.setState({
      mapSidebarProjectCount: this.mapPreviewProjects.length,
    });
  };

  refreshMapSidebarSampleData = () => {
    this.setState({
      mapSidebarSampleCount: this.mapPreviewSamples.length,
    });
  };

  refreshFilteredDimensions = async () => {
    const { domain, snapshotShareId } = this.props;
    const { projectId, search } = this.state;

    this.setState({
      loadingDimensions: true,
    });

    const {
      projectDimensions: filteredProjectDimensions,
      sampleDimensions: filteredSampleDimensions,
    } = await getDiscoveryDimensions({
      domain,
      projectId,
      snapshotShareId,
      filters: this.preparedFilters(),
      search,
    });

    this.setState({
      filteredProjectDimensions,
      filteredSampleDimensions,
      loadingDimensions: false,
    });
  };

  refreshFilteredLocations = async () => {
    const { domain } = this.props;
    const { mapLevel, projectId, search } = this.state;

    this.setState({
      loadingLocations: true,
    });

    const mapLocationData = await getDiscoveryLocations({
      domain,
      projectId,
      filters: this.preparedFilters(),
      search,
    });

    this.setState(
      {
        mapLocationData,
        rawMapLocationData: mapLocationData,
        loadingLocations: false,
      },
      () => {
        this.refreshMapPreviewedData();
        this.handleMapLevelChange(mapLevel);
      }
    );
  };

  refreshSelectedPLQCSamples = () => {
    this.setState(
      {
        plqcPreviewedSamples: null,
      },
      this.refreshPLQCPreviewedSamples
    );
  };

  loadUserDataStats = async () => {
    const { domain } = this.props;
    const { projectId } = this.state;
    let { workflow } = this.state;

    this.setState({
      userDataCounts: null,
    });
    const stats = await getDiscoveryStats({
      domain: domain,
      projectId,
    });

    const numOfCgSamples = getOr(
      0,
      WORKFLOWS.CONSENSUS_GENOME.value,
      stats.sampleStats.countByWorkflow
    );
    const numOfMngsSamples = getOr(
      0,
      WORKFLOWS.SHORT_READ_MNGS.value,
      stats.sampleStats.countByWorkflow
    );
    if (numOfMngsSamples === 0 && numOfCgSamples > 0) {
      workflow = WORKFLOWS.CONSENSUS_GENOME.value;
    } else if (numOfCgSamples === 0 && numOfMngsSamples > 0) {
      workflow = WORKFLOWS.SHORT_READ_MNGS.value;
    }

    this.setState(
      {
        workflow,
        userDataCounts: {
          sampleCountByWorkflow: stats.sampleStats.countByWorkflow,
          sampleCount: stats.sampleStats.count,
          projectCount: stats.sampleStats.projectCount,
        },
      },
      () => {
        this.updateBrowsingHistory("replace");
      }
    );
  };

  computeTabs = () => {
    const { domain } = this.props;
    const {
      projectId,
      filteredProjectCount,
      filteredSampleCount,
      filteredVisualizationCount,
    } = this.state;

    const renderTab = (label, count) => {
      return (
        <div>
          <span className={cs.tabLabel}>{label}</span>
          <span className={cs.tabCounter}>{count}</span>
        </div>
      );
    };
    return compact([
      !projectId && {
        label: renderTab("Projects", filteredProjectCount || "-"),
        value: "projects",
      },
      {
        label: renderTab("Samples", filteredSampleCount || "-"),
        value: "samples",
      },
      domain !== DISCOVERY_DOMAIN_PUBLIC &&
        !projectId && {
          label: renderTab("Visualizations", filteredVisualizationCount || "-"),
          value: "visualizations",
        },
    ]);
  };

  handleTabChange = currentTab => {
    const { mapSidebarTab } = this.state;
    this.setState({ currentTab }, () => {
      this.updateBrowsingHistory("replace");
      const name = currentTab.replace(/\W+/g, "-").toLowerCase();
      logAnalyticsEvent(`DiscoveryView_tab-${name}_clicked`, {
        currentTab: currentTab,
      });
    });

    // Set to match 'samples' or 'projects'
    if (mapSidebarTab !== "summary") {
      this.setState({ mapSidebarTab: currentTab });
    }
  };

  handleFilterChange = selectedFilters => {
    this.setState({ filters: selectedFilters }, () => {
      this.updateBrowsingHistory("replace");
      this.resetDataFromFilterChange();
      logAnalyticsEvent(`DiscoveryView_filters_changed`, {
        filters: this.getFilterCount(),
      });
    });
  };

  handleSampleActiveColumnsChange = activeColumns => {
    const { workflow, sampleActiveColumnsByWorkflow } = this.state;

    sampleActiveColumnsByWorkflow[workflow] = activeColumns;
    this.setState({ sampleActiveColumnsByWorkflow }, () => {
      this.updateBrowsingHistory("replace");
    });
  };

  // From the right pane sidebar, we'll add the filter value they click on if not already selected.
  // Don't call this for single selection filters.
  handleMetadataFilterClick = (field, value) => {
    const { filters: selectedFilters } = this.state;

    const key = `${field}Selected`;
    if (selectedFilters[key]) {
      if (selectedFilters[key].includes(value)) return;
      selectedFilters[key].push(value);
    } else {
      selectedFilters[key] = [value];
    }

    this.handleFilterChange(selectedFilters);
  };

  handleSearchSelected = ({ key, value, text }, currentEvent) => {
    const { filters, search } = this.state;

    const dimensions = this.getCurrentDimensions();

    let newFilters = clone(filters);
    const selectedKey = `${key}Selected`;
    let filtersChanged = false;
    switch (key) {
      case "taxon": {
        // If the user selected a taxon we add it to the dropdown
        // (since we do know which options are available, we always added)
        newFilters[selectedKey] = xorBy(
          "value",
          [{ value, text }],
          newFilters[selectedKey]
        );
        filtersChanged = true;
        break;
      }
      case "sample": {
        this.handleSampleSelected({ sample: { id: value }, currentEvent });
        break;
      }
      case "project": {
        this.handleProjectSelected({
          project: this.projects.get(value) || { id: value },
        });
        break;
      }
      default: {
        // For other 'dimension' types of search we check if it is a valid option
        // If so, we add a new filter, otherwise we ignore it
        const dimension = find({ dimension: key }, dimensions);
        // TODO(tiago): currently we check if it is a valid option. We should (preferably) change server endpoint
        // to filter by project/sample set or at least provide feedback to the user in else branch
        if (dimension && find({ value }, dimension.values)) {
          newFilters[selectedKey] = xor([value], newFilters[selectedKey]);
          filtersChanged = true;
        }
      }
    }
    // We will also clear the search box if we used it to select a suggestion
    if (filtersChanged || search != null) {
      this.setState(
        {
          filters: newFilters,
          search: null,
        },
        () => {
          this.updateBrowsingHistory("replace");
          this.resetDataFromFilterChange();
        }
      );
    }
    logAnalyticsEvent("DiscoveryView_search_selected", {
      key,
      value,
      text,
      filtersChanged,
    });
  };

  handleStringSearch = search => {
    const { search: currentSearch } = this.state;

    let parsedSearch = (search && search.trim()) || null;
    if (currentSearch !== parsedSearch) {
      this.setState({ search: parsedSearch }, () => {
        this.updateBrowsingHistory("replace");
        this.resetDataFromFilterChange();
        logAnalyticsEvent("DiscoveryView_string-search_entered", {
          search: parsedSearch,
        });
      });
    }
  };

  handleFilterToggle = () => {
    this.setState({ showFilters: !this.state.showFilters }, () => {
      this.updateBrowsingHistory("replace");
      logAnalyticsEvent("DiscoveryView_show-filters_toggled", {
        showFilters: this.state.showFilters,
      });
    });
  };

  handleStatsToggle = () => {
    this.setState({ showStats: !this.state.showStats }, () => {
      this.updateBrowsingHistory("replace");
      logAnalyticsEvent("DiscoveryView_show-stats_toggled", {
        showFilters: this.state.showStats,
      });
    });
  };

  getConditions = () => {
    const { projectId, search } = this.state;
    const { snapshotShareId } = this.props;

    return {
      projectId,
      snapshotShareId,
      search,
      filters: this.preparedFilters(),
    };
  };

  handleProjectSelected = ({ project }) => {
    const { mapSidebarTab } = this.state;

    this.setState(
      {
        currentDisplay: "table",
        currentTab: "samples",
        mapSidebarTab: mapSidebarTab === "summary" ? mapSidebarTab : "samples",
        projectId: project.id,
        search: null,
      },
      () => {
        this.projects.reset({ conditions: this.getConditions() });
        this.projects.loadPage(0);
        this.clearMapPreview();
        this.updateBrowsingHistory();
        this.refreshDataFromProjectChange();
      }
    );
  };

  handleSampleSelected = ({ sample, currentEvent }) => {
    let url = this.getSnapshotPrefix() + `/samples/${sample.id}`;
    openUrl(url, currentEvent);
  };

  getSnapshotPrefix = () => {
    const { snapshotShareId } = this.props;
    return snapshotShareId ? `/pub/${snapshotShareId}` : "";
  };

  handleProjectUpdated = ({ project }) => {
    this.dataLayer.projects.update(project);
    this.setState({
      project,
    });
  };

  getCurrentDimensions = () => {
    const { currentTab, projectDimensions, sampleDimensions } = this.state;

    return {
      projects: projectDimensions,
      samples: sampleDimensions,
    }[currentTab];
  };

  getClientSideSuggestions = async query => {
    const dimensions = this.getCurrentDimensions();

    let suggestions = {};
    const re = new RegExp(escapeRegExp(query), "i");
    ["host", "tissue", "locationV2"].forEach(category => {
      let dimension = find({ dimension: category }, dimensions);
      if (dimension) {
        const results = dimension.values
          .filter(entry => re.test(entry.text))
          .map(entry => ({
            category,
            id: entry.value,
            title: entry.text,
          }));

        if (results.length) {
          suggestions[category] = {
            name: this.getName(category),
            results,
          };
        }
      }
    });

    return suggestions;
  };

  getName = category => {
    if (category === "locationV2") {
      return "location";
    } else if (category === "tissue") {
      // It's too hard to rename all JS so we just rename here
      return "Sample Type";
    } else {
      return capitalize(category);
    }
  };

  handleProjectDescriptionSave = value => {
    this.setState({
      project: { ...this.state.project, description: value },
    });
  };

  getServerSideSuggestions = async query => {
    const { domain } = this.props;

    let results = await getSearchSuggestions({
      // NOTE: backend also supports "tissue", "location", "host" and more
      categories: ["sample", "project", "taxon"],
      query,
      domain,
    });
    return results;
  };

  handleSearchTriggered = async query => {
    const [clientSideSuggestions, serverSideSuggestions] = await Promise.all([
      // client side: for dimensions (host, location, tissue)
      this.getClientSideSuggestions(query),
      // server side: for taxa, projects and samples search (filter by domain)
      this.getServerSideSuggestions(query),
    ]);

    return merge(clientSideSuggestions, serverSideSuggestions);
  };

  getFilterCount = () => {
    const { filters } = this.state;
    return sumBy(
      filters => (Array.isArray(filters) ? filters.length : !filters ? 0 : 1),
      values(filters)
    );
  };

  handleDisplaySwitch = currentDisplay => {
    this.setState({ currentDisplay }, () => {
      this.updateBrowsingHistory("replace");
    });
  };

  handleMapTooltipTitleClick = locationId => {
    const { currentTab } = this.state;
    this.setState(
      {
        mapPreviewedLocationId: locationId,
        mapSidebarTab: currentTab,
        showStats: true,
      },
      () => {
        this.refreshMapPreviewedData();
      }
    );
  };

  handleMapMarkerClick = locationId => {
    this.setState(
      {
        mapPreviewedLocationId: locationId,
        showStats: true,
      },
      () => {
        this.refreshMapPreviewedData();
      }
    );
  };

  clearMapPreview = () => {
    const { mapPreviewedLocationId } = this.state;
    if (mapPreviewedLocationId) {
      this.mapPreviewProjects = this.projects;
      this.mapPreviewSamples = this.samples;
      this.setState({
        mapPreviewedLocationId: null,
        mapSidebarProjectCount: null,
        mapSidebarProjectDimensions: [],
        mapSidebarSampleCount: null,
        mapSidebarSampleDimensions: [],
        mapSidebarSampleStats: {},
      });
    }
  };

  refreshMapPreviewedSamples = async () => {
    const { mapLocationData, mapPreviewedLocationId } = this.state;

    if (!mapPreviewedLocationId || !mapLocationData[mapPreviewedLocationId]) {
      // Previewed location has been filtered out, so exit preview mode.
      this.mapPreviewSamples = this.samples;
      this.setState({
        mapPreviewedLocationId: null,
        mapSidebarSampleCount: null,
        mapSidebarSampleDimensions: [],
        mapSidebarSampleStats: {},
      });
    } else {
      let conditions = this.getConditions();
      conditions.filters.locationV2 = [
        mapLocationData[mapPreviewedLocationId].name,
      ];
      this.mapPreviewSamples = this.dataLayer.samples.createView({
        conditions,
        onViewChange: this.refreshMapSidebarSampleData,
        displayName: "MapPreviewSamplesView",
      });
      this.mapPreviewSamples.loadPage(0);
    }
  };

  handlePLQCHistogramBarClick = sampleIds => {
    this.setState(
      {
        plqcPreviewedSamples: sampleIds,
        showStats: true,
      },
      () => {
        this.refreshPLQCPreviewedSamples();
      }
    );
  };

  refreshPLQCPreviewedSamples = async () => {
    const { plqcPreviewedSamples } = this.state;
    const { domain } = this.props;
    const conditions = this.getConditions();

    if (plqcPreviewedSamples && plqcPreviewedSamples.length > 0) {
      conditions.sampleIds = plqcPreviewedSamples;
      this.mapPreviewSamples = this.dataLayer.samples.createView({
        conditions,
        onViewChange: this.refreshMapSidebarSampleData,
        displayName: "MapPreviewSamplesView",
      });
      this.mapPreviewSamples.loadPage(0);
    } else {
      // if no sample ids, then display all samples
      this.mapPreviewSamples = this.samples;
    }

    const mapSidebarSampleCount =
      plqcPreviewedSamples && plqcPreviewedSamples.length > 0
        ? plqcPreviewedSamples.length
        : this.mapPreviewSamples.length;
    const [{ sampleStats }, { sampleDimensions }] = await Promise.all([
      getDiscoveryStats({ domain, ...conditions }),
      getDiscoveryDimensions({ domain, ...conditions }),
    ]);
    this.setState({
      mapSidebarTab: "samples",
      mapSidebarSampleStats: sampleStats,
      mapSidebarSampleCount: mapSidebarSampleCount,
      mapSidebarSampleDimensions: sampleDimensions,
    });
    this.mapPreviewSidebar && this.mapPreviewSidebar.reset();
  };

  refreshMapPreviewedProjects = async () => {
    const { mapLocationData, mapPreviewedLocationId } = this.state;

    if (!mapPreviewedLocationId || !mapLocationData[mapPreviewedLocationId]) {
      // Previewed location has been filtered out, so exit preview mode.
      this.mapPreviewProjects = this.projects;
      this.setState({
        mapPreviewedLocationId: null,
        mapSidebarProjectCount: null,
        mapSidebarProjectDimensions: [],
      });
    } else {
      let conditions = this.getConditions();
      conditions.filters.locationV2 = [
        mapLocationData[mapPreviewedLocationId].name,
      ];
      this.mapPreviewProjects = this.dataLayer.projects.createView({
        conditions,
        onViewChange: this.refreshMapSidebarProjectData,
        displayName: "MapPreviewProjectsView",
      });
      this.mapPreviewProjects.loadPage(0);
    }
  };

  refreshMapPreviewedDimensions = async () => {
    const { mapLocationData, mapPreviewedLocationId } = this.state;
    const { domain } = this.props;

    if (!mapPreviewedLocationId || !mapLocationData[mapPreviewedLocationId]) {
      return;
    }

    // Fetch stats and dimensions for the map sidebar. Special request with the current filters
    // and the previewed location.
    const params = this.getConditions();
    params.filters["locationV2"] = mapLocationData[mapPreviewedLocationId].name;
    const [
      { sampleStats },
      { projectDimensions, sampleDimensions },
    ] = await Promise.all([
      getDiscoveryStats({ domain, ...params }),
      getDiscoveryDimensions({ domain, ...params }),
    ]);
    this.setState({
      mapSidebarProjectDimensions: projectDimensions,
      mapSidebarSampleDimensions: sampleDimensions,
      mapSidebarSampleStats: sampleStats,
    });
  };

  refreshMapPreviewedData = async () => {
    this.refreshMapPreviewedSamples();
    this.refreshMapPreviewedProjects();
    this.refreshMapPreviewedDimensions();
    this.mapPreviewSidebar && this.mapPreviewSidebar.reset();
  };

  handleSelectedSamplesUpdate = selectedSampleIds => {
    const { workflow } = this.state;
    this.setState(prevState => ({
      selectedSampleIds: {
        ...prevState.selectedSampleIds,
        [workflow]: selectedSampleIds,
      },
    }));
  };

  handleMapSidebarTabChange = mapSidebarTab => {
    this.setState({ mapSidebarTab });
  };

  handleClearFilters = () => {
    this.setState({ filters: {}, search: null }, () => {
      this.updateBrowsingHistory("replace");
      this.resetDataFromFilterChange();
    });
  };

  handleMapLevelChange = mapLevel => {
    const { rawMapLocationData, currentTab } = this.state;

    const ids = currentTab === "samples" ? "sample_ids" : "project_ids";
    const clusteredData = {};

    const copyLocation = entry => {
      return {
        ...entry,
        [ids]: Object.assign([], entry[ids]),
        hasOwnEntries: !isEmpty(entry[ids]),
      };
    };

    const addToAncestor = (entry, ancestorLevel) => {
      const ancestorId = entry[`${ancestorLevel}_id`];
      if (ancestorId && rawMapLocationData[ancestorId]) {
        if (!clusteredData[ancestorId]) {
          clusteredData[ancestorId] = copyLocation(
            rawMapLocationData[ancestorId]
          );
        }
        const ancestor = clusteredData[ancestorId];
        ancestor[ids] = union(ancestor[ids], entry[ids]);
      }
    };

    const indexOfMap = indexOfMapLevel(mapLevel);
    for (const [id, entry] of Object.entries(rawMapLocationData)) {
      const indexOfEntry = indexOfMapLevel(entry.geo_level);

      // Have a bubble if you're higher than or at the map's geo level.
      if (indexOfEntry <= indexOfMap && !clusteredData[entry.id]) {
        clusteredData[id] = copyLocation(entry);
      }

      MAP_CLUSTER_ENABLED_LEVELS.forEach(ancestorLevel => {
        // If you have ancestors higher than or at the map's level, add your samples/projects to
        // their bubble.
        if (indexOfMapLevel(ancestorLevel) <= indexOfMap) {
          addToAncestor(entry, ancestorLevel);
        }
      });
    }

    // Remove ancestor bubbles that are now fully represented in sub-bubbles
    for (const [id, entry] of Object.entries(clusteredData)) {
      const indexOfEntry = indexOfMapLevel(entry.geo_level);
      if (indexOfEntry < indexOfMap && !entry.hasOwnEntries) {
        delete clusteredData[id];
      }
    }

    this.setState({ mapLocationData: clusteredData, mapLevel });
  };

  checkPublicSamples = () => {
    get("/samples/samples_going_public.json").then(res => {
      if ((res || []).length) this.displayPublicSampleNotifications(res);
    });
  };

  displayPublicSampleNotifications = samplesGoingPublic => {
    let previouslyDismissedSamples = new Set();
    try {
      previouslyDismissedSamples = new Set(
        JSON.parse(localStorage.getItem("dismissedPublicSamples"))
      );
    } catch (_) {
      // catch and ignore possible old formats
    }

    let [dismissedSamples, newSamples] = partition(
      sample => previouslyDismissedSamples.has(sample.id),
      samplesGoingPublic
    );
    if (newSamples.length > 0) {
      // The purpose of setItem here is to keep the dismissed list from growing indefinitely. The
      // value here will no longer include samples that went public in the past.
      localStorage.setItem(
        "dismissedPublicSamples",
        JSON.stringify(map("id", dismissedSamples))
      );
      publicSampleNotificationsByProject(newSamples);
    }
  };

  handleModalFirstTimeUserClose = () => {
    this.setState({
      emptyStateModalOpen: false,
    });
  };

  renderNoDataBanners = () => {
    const {
      currentTab,
      emptyStateModalOpen,
      userDataCounts,
      projectId,
    } = this.state;
    const { visualizations } = this;

    if (!userDataCounts) return null;

    if (emptyStateModalOpen) {
      localStorage.setItem("DiscoveryViewSeenBefore", "1");
      return (
        <ModalFirstTimeUser onClose={this.handleModalFirstTimeUserClose} />
      );
    }

    switch (currentTab) {
      case "projects":
        if (userDataCounts.projectCount === 0) {
          return (
            <div className={cs.noDataBannerFlexContainer}>
              <InfoBanner
                className={cs.noDataBannerContainer}
                icon={<BannerProjects />}
                link={{
                  href: "/samples/upload",
                  text: "Upload your data",
                }}
                message="You will see your projects here after you upload data or when you are invited to a project."
                title="Projects"
                type="no_projects"
              />
            </div>
          );
        }
        break;
      case "samples":
        if (userDataCounts.sampleCount === 0) {
          return (
            <div className={cs.noDataBannerFlexContainer}>
              <InfoBanner
                className={cs.noDataBannerContainer}
                icon={<BannerSamples />}
                link={{
                  href: "/samples/upload",
                  text: "Upload your data",
                }}
                message={`You will see your samples here after you upload data ${
                  projectId
                    ? "to your project"
                    : "or when you are invited to a project"
                }.`}
                title="Samples"
                type="no_samples"
              />
            </div>
          );
        }
        break;
      case "visualizations":
        // visualizations are not filtered by conditions (not supported at this time)
        // thus we use the object collection view from DataDiscoveryDataLayer directly
        // and we never show the no search results banner.
        if (!visualizations.isLoading() && visualizations.length === 0) {
          return (
            <div className={cs.noDataBannerFlexContainer}>
              <InfoBanner
                className={cs.noDataBannerContainer}
                icon={<BannerVisualizations />}
                link={{
                  href: VISUALIZATIONS_DOC_LINK,
                  text: "Learn about Heatmaps",
                  external: true,
                }}
                message="You will see your saved Heatmaps and Phylogenetic Trees here. Create them on the Samples tab."
                title="Visualizations"
                type="no_visualizations"
              />
            </div>
          );
        }
        break;
    }
    return null;
  };

  renderNoDataWorkflowBanner = workflow => {
    const workflowLabel =
      workflow === WORKFLOWS.SHORT_READ_MNGS.value
        ? WORKFLOWS.SHORT_READ_MNGS.label
        : WORKFLOWS.CONSENSUS_GENOME.label;
    return (
      <InfoBanner
        className={cs.noResultsContainer}
        icon={<BannerSamples />}
        link={{
          href: "/samples/upload",
          text: `Run ${workflowLabel}s`,
        }}
        message={`No samples were processed by the ${workflowLabel} Pipeline.`}
        title={`0 ${workflowLabel} Samples`}
        type={workflow}
      />
    );
  };

  renderNoSearchResultsBanner = type => {
    return (
      <div className={cs.noDataBannerFlexContainer}>
        <InfoBanner
          className={cs.noResultsContainer}
          message="Sorry, no results match your search."
          suggestion="Try another search"
          type={type}
        />
      </div>
    );
  };

  renderWorkflowTabs = () => {
    const { workflow } = this.state;
    return (
      <Tabs
        className={cs.workflowTabs}
        tabs={this.computeWorkflowTabs()}
        value={this.samplesByWorkflow[workflow].displayName}
        onChange={this.handleWorkflowTabChange}
        hideBorder
      />
    );
  };

  handleWorkflowTabChange = workflow => {
    const view = this.samplesByWorkflow[workflow];
    // PLQC is currently only available for mNGS samples.
    let { currentDisplay } = this.state;
    currentDisplay =
      currentDisplay === "plqc" && workflow === WORKFLOWS.CONSENSUS_GENOME.value
        ? "table"
        : currentDisplay;

    this.setState(
      {
        currentDisplay,
        selectableSampleIds: view.getIds(),
        workflow,
      },
      () => {
        this.updateBrowsingHistory("replace");
        this.samplesView && this.samplesView.reset();
      }
    );
    logAnalyticsEvent(`DiscoveryView_${workflow}-tab_clicked`);
  };

  computeWorkflowTabs = () => {
    return WORKFLOW_ORDER.map(name => ({
      label: (
        <React.Fragment>
          <span className={cs.tabLabel}>{`${WORKFLOWS[name].label}s`}</span>
          <span className={cs.tabCounter}>
            {this.samplesByWorkflow[WORKFLOWS[name].value].length || "0"}
          </span>
        </React.Fragment>
      ),
      value: WORKFLOWS[name].value,
    }));
  };

  renderCenterPaneContent = () => {
    const {
      currentDisplay,
      currentTab,
      mapLevel,
      mapLocationData,
      mapPreviewedLocationId,
      projectId,
      sampleActiveColumnsByWorkflow,
      selectableSampleIds,
      selectedSampleIds,
      showFilters,
      showStats,
      userDataCounts,
      workflow,
    } = this.state;

    const { admin, allowedFeatures, mapTilerKey, snapshotShareId } = this.props;
    const { projects, visualizations } = this;

    const samples = this.samplesByWorkflow[workflow];
    const tableHasLoaded = !samples.isLoading() && currentDisplay === "table";
    return (
      <React.Fragment>
        {currentTab === "projects" && (
          <div className={cs.tableContainer}>
            <div className={cs.dataContainer}>
              <ProjectsView
                allowedFeatures={allowedFeatures}
                currentDisplay={currentDisplay}
                currentTab={currentTab}
                mapLevel={mapLevel}
                mapLocationData={mapLocationData}
                mapPreviewedLocationId={mapPreviewedLocationId}
                mapTilerKey={mapTilerKey}
                onClearFilters={this.handleClearFilters}
                onDisplaySwitch={this.handleDisplaySwitch}
                onLoadRows={projects.handleLoadObjectRows}
                onMapClick={this.clearMapPreview}
                onMapLevelChange={this.handleMapLevelChange}
                onMapMarkerClick={this.handleMapMarkerClick}
                onProjectSelected={this.handleProjectSelected}
                onMapTooltipTitleClick={this.handleMapTooltipTitleClick}
                projects={projects}
                ref={projectsView => (this.projectsView = projectsView)}
              />
            </div>
            {!projects.length &&
              !projects.isLoading() &&
              currentDisplay === "table" &&
              this.renderNoSearchResultsBanner("projects")}
          </div>
        )}
        {currentTab === "samples" && (
          <div className={cs.tableContainer}>
            <div className={cs.dataContainer}>
              {currentDisplay !== "map" && this.renderWorkflowTabs()}
              {userDataCounts &&
              !userDataCounts.sampleCountByWorkflow[workflow] ? (
                this.renderNoDataWorkflowBanner(workflow)
              ) : (
                <SamplesView
                  activeColumns={sampleActiveColumnsByWorkflow[workflow]}
                  admin={admin}
                  allowedFeatures={allowedFeatures}
                  currentDisplay={currentDisplay}
                  currentTab={currentTab}
                  filters={this.preparedFilters()}
                  mapLevel={mapLevel}
                  mapLocationData={mapLocationData}
                  mapPreviewedLocationId={mapPreviewedLocationId}
                  mapTilerKey={mapTilerKey}
                  onActiveColumnsChange={this.handleSampleActiveColumnsChange}
                  onClearFilters={this.handleClearFilters}
                  onDisplaySwitch={this.handleDisplaySwitch}
                  onLoadRows={samples.handleLoadObjectRows}
                  onPLQCHistogramBarClick={this.handlePLQCHistogramBarClick}
                  onMapClick={this.clearMapPreview}
                  onMapLevelChange={this.handleMapLevelChange}
                  onMapMarkerClick={this.handleMapMarkerClick}
                  onMapTooltipTitleClick={this.handleMapTooltipTitleClick}
                  onSampleSelected={this.handleSampleSelected}
                  onSelectedSamplesUpdate={this.handleSelectedSamplesUpdate}
                  projectId={projectId}
                  snapshotShareId={snapshotShareId}
                  ref={samplesView => (this.samplesView = samplesView)}
                  samples={samples}
                  selectableIds={selectableSampleIds}
                  selectedSampleIds={selectedSampleIds[workflow]}
                  filtersSidebarOpen={showFilters}
                  sampleStatsSidebarOpen={showStats}
                  hideTriggers={
                    !!snapshotShareId ||
                    (workflow &&
                      this.samplesByWorkflow[workflow].displayName ===
                        WORKFLOWS.CONSENSUS_GENOME.value &&
                      !allowedFeatures.includes(CG_BULK_DOWNLOADS_FEATURE))
                  }
                  workflow={workflow}
                />
              )}
            </div>
            {userDataCounts &&
              userDataCounts.sampleCountByWorkflow[workflow] &&
              !samples.length &&
              tableHasLoaded &&
              this.renderNoSearchResultsBanner("samples")}
          </div>
        )}
        {currentTab === "visualizations" && (
          <div className={cs.tableContainer}>
            <div className={cs.dataContainer}>
              <VisualizationsView visualizations={visualizations} />
            </div>
            {!visualizations.length &&
              !visualizations.isLoading() &&
              currentDisplay === "table" &&
              this.renderNoSearchResultsBanner("visualizations")}
          </div>
        )}
      </React.Fragment>
    );
  };

  renderRightPane = () => {
    const { allowedFeatures, domain } = this.props;
    const {
      currentDisplay,
      currentTab,
      filteredProjectCount,
      filteredProjectDimensions,
      filteredSampleCount,
      filteredSampleDimensions,
      filteredSampleStats,
      loadingDimensions,
      loadingStats,
      mapPreviewedLocationId,
      mapSidebarProjectCount,
      mapSidebarProjectDimensions,
      mapSidebarSampleCount,
      mapSidebarSampleDimensions,
      mapSidebarSampleStats,
      selectedSampleIds,
      mapSidebarTab,
      plqcPreviewedSamples,
      projectDimensions,
      project,
      sampleDimensions,
      search,
      showStats,
      userDataCounts,
      workflow,
    } = this.state;
    const { snapshotShareId, snapshotProjectDescription } = this.props;
    const filterCount = this.getFilterCount();
    const computedProjectDimensions =
      filterCount || search ? filteredProjectDimensions : projectDimensions;
    const computedSampleDimensions =
      filterCount || search ? filteredSampleDimensions : sampleDimensions;
    const loading = loadingDimensions || loadingStats;

    return (
      <div className={cs.rightPane}>
        {showStats &&
          currentTab !== "visualizations" &&
          (currentDisplay !== "table" ? (
            <MapPreviewSidebar
              allowedFeatures={allowedFeatures}
              currentTab={mapSidebarTab}
              discoveryCurrentTab={currentTab}
              domain={domain}
              loading={loading}
              onFilterClick={this.handleMetadataFilterClick}
              onProjectSelected={this.handleProjectSelected}
              onSampleClicked={this.handleSampleSelected}
              onSelectionUpdate={this.handleSelectedSamplesUpdate}
              onTabChange={this.handleMapSidebarTabChange}
              projectDimensions={
                !mapPreviewedLocationId
                  ? computedProjectDimensions
                  : mapSidebarProjectDimensions
              }
              projects={this.mapPreviewProjects}
              projectStats={{
                count: !mapPreviewedLocationId
                  ? filteredProjectCount
                  : mapSidebarProjectCount,
              }}
              ref={mapPreviewSidebar =>
                (this.mapPreviewSidebar = mapPreviewSidebar)
              }
              sampleDimensions={
                !mapPreviewedLocationId && !plqcPreviewedSamples
                  ? computedSampleDimensions
                  : mapSidebarSampleDimensions
              }
              samples={this.mapPreviewSamples}
              sampleStats={
                !mapPreviewedLocationId && !plqcPreviewedSamples
                  ? {
                      ...filteredSampleStats,
                      count: filteredSampleCount,
                    }
                  : {
                      ...mapSidebarSampleStats,
                      count: mapSidebarSampleCount,
                    }
              }
              selectedSampleIds={selectedSampleIds[workflow]}
            />
          ) : (
            <DiscoverySidebar
              allowedFeatures={allowedFeatures}
              currentTab={currentTab}
              noDataAvailable={
                domain === DISCOVERY_DOMAIN_MY_DATA &&
                userDataCounts &&
                !userDataCounts.projectCount
              }
              loading={loading}
              onFilterClick={this.handleMetadataFilterClick}
              projectDimensions={computedProjectDimensions}
              projectStats={
                // if no filtered samples are present, setting the project count to null
                // will display the no results sidebar
                domain === DISCOVERY_DOMAIN_SNAPSHOT
                  ? { count: filteredSampleCount ? 1 : null }
                  : { count: filteredProjectCount }
              }
              sampleDimensions={computedSampleDimensions}
              sampleStats={{
                ...filteredSampleStats,
                count: filteredSampleCount,
              }}
              project={
                !snapshotShareId
                  ? project
                  : {
                      editable: false,
                      description: snapshotProjectDescription,
                    }
              }
              onProjectDescriptionSave={this.handleProjectDescriptionSave}
            />
          ))}
      </div>
    );
  };

  render() {
    const {
      currentDisplay,
      currentTab,
      filters,
      project,
      projectId,
      search,
      showFilters,
      showStats,
      userDataCounts,
    } = this.state;
    const { domain, allowedFeatures, snapshotProjectName } = this.props;

    const tabs = this.computeTabs();
    const dimensions = this.getCurrentDimensions();
    const filterCount = this.getFilterCount();

    return (
      <div className={cs.layout}>
        <div className={cs.headerContainer}>
          {projectId && (
            <ProjectHeader
              project={project || {}}
              snapshotProjectName={snapshotProjectName}
              fetchedSamples={this.samples.loaded}
              onProjectUpdated={this.handleProjectUpdated}
              onMetadataUpdated={this.refreshDataFromProjectChange}
            />
          )}
          <DiscoveryHeader
            currentTab={currentTab}
            domain={domain}
            filterCount={filterCount}
            onFilterToggle={this.handleFilterToggle}
            onStatsToggle={this.handleStatsToggle}
            onSearchTriggered={this.handleSearchTriggered}
            onSearchSuggestionsReceived={this.handleSearchSuggestionsReceived}
            onSearchResultSelected={this.handleSearchSelected}
            onSearchEnterPressed={this.handleStringSearch}
            onTabChange={this.handleTabChange}
            searchValue={search || ""}
            showStats={showStats && !!dimensions}
            showFilters={showFilters && !!dimensions}
            tabs={tabs}
          />
        </div>
        <Divider style="medium" />
        <div className={cs.mainContainer}>
          <div className={cs.leftPane}>
            {showFilters && dimensions && (
              <DiscoveryFilters
                {...mapValues(
                  dim => dim.values,
                  keyBy("dimension", dimensions)
                )}
                {...filters}
                domain={domain}
                onFilterChange={this.handleFilterChange}
                allowedFeatures={allowedFeatures}
              />
            )}
          </div>
          <div className={cs.centerPane}>
            {userDataCounts &&
              (currentDisplay === "map" &&
              ["samples", "projects"].includes(currentTab) ? (
                <div className={cs.viewContainer}>
                  {(domain === DISCOVERY_DOMAIN_MY_DATA &&
                    this.renderNoDataBanners()) ||
                    this.renderCenterPaneContent()}
                </div>
              ) : (
                <NarrowContainer className={cs.viewContainer}>
                  {(domain === DISCOVERY_DOMAIN_MY_DATA &&
                    this.renderNoDataBanners()) ||
                    this.renderCenterPaneContent()}
                </NarrowContainer>
              ))}
            {domain === DISCOVERY_DOMAIN_SNAPSHOT && (
              <NarrowContainer className={cs.viewContainer}>
                {this.renderNoDataBanners() || this.renderCenterPaneContent()}
              </NarrowContainer>
            )}
          </div>
          {this.renderRightPane()}
        </div>
      </div>
    );
  }
}

DiscoveryView.propTypes = {
  domain: PropTypes.oneOf(DISCOVERY_DOMAINS).isRequired,
  projectId: PropTypes.number,
  snapshotProjectName: PropTypes.string,
  snapshotProjectDescription: PropTypes.string,
  snapshotShareId: PropTypes.string,
  allowedFeatures: PropTypes.arrayOf(PropTypes.string),
  mapTilerKey: PropTypes.string,
  admin: PropTypes.bool,
};

DiscoveryView.contextType = UserContext;

export default DiscoveryView;
