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
import { openUrl } from "~utils/links";
import { VISUALIZATIONS_DOC_LINK } from "~utils/documentationLinks";
import NarrowContainer from "~/components/layout/NarrowContainer";
import { Divider } from "~/components/layout";
import { MAP_CLUSTER_ENABLED_LEVELS } from "~/components/views/discovery/mapping/constants";
import { indexOfMapLevel } from "~/components/views/discovery/mapping/utils";
import { publicSampleNotificationsByProject } from "~/components/views/samples/notifications";
import BannerProjects from "~ui/icons/BannerProjects";
import BannerSamples from "~ui/icons/BannerSamples";
import BannerVisualizations from "~ui/icons/BannerVisualizations";
import { UserContext } from "~/components/common/UserContext";

import DiscoveryHeader from "./DiscoveryHeader";
import EmptyStateModal from "./EmptyStateModal";
import ProjectsView from "../projects/ProjectsView";
import SamplesView from "../samples/SamplesView";
import VisualizationsView from "../visualizations/VisualizationsView";
import DiscoverySidebar from "./DiscoverySidebar";
import DiscoveryFilters from "./DiscoveryFilters";
import { DiscoveryDataLayer } from "./DiscoveryDataLayer";
import ProjectHeader from "./ProjectHeader";
import {
  getDiscoveryDimensions,
  getDiscoveryStats,
  getDiscoveryLocations,
  DISCOVERY_DOMAIN_ALL_DATA,
  DISCOVERY_DOMAIN_MY_DATA,
  DISCOVERY_DOMAIN_PUBLIC,
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

    const { projectId } = this.props;

    this.urlParser = new UrlQueryParser({
      sampleActiveColumns: "object",
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
          projectId || this.props.domain === DISCOVERY_DOMAIN_ALL_DATA
            ? "samples"
            : "projects",
        emptyStateModalOpen: this.isFirstTimeUser(),
        filteredProjectDimensions: [],
        filteredSampleDimensions: [],
        filteredProjectCount: null,
        filteredSampleCount: null,
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
        sampleActiveColumns: undefined,
        sampleDimensions: [],
        search: null,
        selectableSampleIds: [],
        selectedSampleIds: new Set(),
        showFilters: true,
        showStats: true,
        userDataCounts: null,
      },
      localState,
      sessionState,
      urlState
    );

    this.loadUserDataStats();

    this.dataLayer = new DiscoveryDataLayer(this.props.domain);
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

    // hold references to the views to allow resetting the tables
    this.projectsView = null;
    this.samplesView = null;
    this.mapPreviewSidebar = null;

    // preload first pages
    this.projects.loadPage(0);
    this.samples.loadPage(0);
    this.visualizations.loadPage(0);

    this.updateBrowsingHistory("replace");
  }

  async componentDidMount() {
    this.initialLoad();
    this.checkPublicSamples();

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
    const { domain } = this.props;

    const localFields = ["sampleActiveColumns", "showFilters", "showStats"];

    const sessionFields = concat(localFields, [
      "currentDisplay",
      "mapSidebarTab",
    ]);
    const urlFields = concat(sessionFields, [
      "currentTab",
      "filters",
      "projectId",
      "search",
    ]);
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

    // History state may include some small fields that enable direct loading of previous pages
    // from browser history without having to request those fields from server (e.g. project)
    if (action === "push") {
      history.pushState(
        historyState,
        `DiscoveryView:${domain}`,
        `/${domain}${urlQuery}`
      );
    } else {
      history.replaceState(
        historyState,
        `DiscoveryView:${domain}`,
        `/${domain}${urlQuery}`
      );
    }

    // We want to persist all options when user navigates to other pages within the same session
    sessionStorage.setItem(
      "DiscoveryViewOptions",
      JSON.stringify(sessionState)
    );

    // We want to persist some options when user returns to the page on a different session
    localStorage.setItem("DiscoveryViewOptions", JSON.stringify(localState));
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
    const conditions = this.getConditions();

    this.samples.reset({ conditions, loadFirstPage: true });
    this.projects.reset({ conditions, loadFirstPage: true });
    this.visualizations.reset({ conditions, loadFirstPage: true });
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
    // * Initial load:
    //   - load (A) non-filtered dimensions, (C) filtered stats, (D) filtered locations, and (E) synchronous table data
    this.refreshDimensions();
    this.refreshFilteredStats();
    this.refreshFilteredLocations();
    //   * if filter or project is set
    //     - load (B) filtered dimensions
    (this.getFilterCount() || project) && this.refreshFilteredDimensions();
  };

  resetDataFromFilterChange = () => {
    this.resetData({
      callback: () => {
        // * On filter change:
        //   - load (B) filtered dimensions, (C) filtered stats, (D) filtered locations
        this.refreshFilteredDimensions();
        this.refreshFilteredStats();
        this.refreshFilteredLocations();
      },
    });
  };

  refreshDataFromProjectChange = () => {
    this.resetData({
      callback: () => {
        // * On project selected
        //   - load (A) non-filtered dimensions, (B) filtered dimensions and (C) filtered stats
        //     (synchronous data not needed for now because we do not show projects and visualizations)
        this.refreshDimensions();
        this.refreshFilteredDimensions();
        this.refreshFilteredStats();
        this.refreshFilteredLocations();
      },
    });
  };

  refreshDimensions = async () => {
    const { domain } = this.props;
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
    });

    this.setState({
      projectDimensions,
      sampleDimensions,
      loadingDimensions: false,
    });
  };

  refreshFilteredStats = async () => {
    const { domain } = this.props;
    const { projectId, search } = this.state;

    this.setState({
      loadingStats: true,
    });

    const { sampleStats: filteredSampleStats } = await getDiscoveryStats({
      domain,
      projectId,
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
    this.setState({
      filteredSampleCount: this.samples.length,
      selectableSampleIds: this.samples.getIds(),
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
    const { domain } = this.props;
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

  loadUserDataStats = async () => {
    const stats = await getDiscoveryStats({
      domain: DISCOVERY_DOMAIN_MY_DATA,
    });
    this.setState({
      userDataCounts: {
        sampleCount: stats.sampleStats.count,
        projectCount: stats.sampleStats.projectCount,
      },
    });
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
    this.setState({ sampleActiveColumns: activeColumns }, () => {
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

    let parsedSearch = search.trim() || null;
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

    return {
      projectId,
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
    openUrl(`/samples/${sample.id}`, currentEvent);
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
    this.setState({ selectedSampleIds });
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

  handleEmptyStateModalClose = () => {
    this.setState({
      emptyStateModalOpen: false,
    });
  };

  renderNoDataBanners = () => {
    const { currentTab, emptyStateModalOpen, userDataCounts } = this.state;
    const { visualizations } = this;

    if (!userDataCounts) return null;

    if (emptyStateModalOpen) {
      localStorage.setItem("DiscoveryViewSeenBefore", "1");
      return <EmptyStateModal onClose={this.handleEmptyStateModalClose} />;
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
                message="You will see your samples here after you upload data or when you are invited to a project."
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

  renderCenterPaneContent = () => {
    const {
      currentDisplay,
      currentTab,
      mapLevel,
      mapLocationData,
      mapPreviewedLocationId,
      projectId,
      sampleActiveColumns,
      selectableSampleIds,
      selectedSampleIds,
    } = this.state;

    const { admin, allowedFeatures, mapTilerKey } = this.props;
    const { projects, samples, visualizations } = this;
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
              <SamplesView
                activeColumns={sampleActiveColumns}
                admin={admin}
                allowedFeatures={allowedFeatures}
                currentDisplay={currentDisplay}
                currentTab={currentTab}
                mapLevel={mapLevel}
                mapLocationData={mapLocationData}
                mapPreviewedLocationId={mapPreviewedLocationId}
                mapTilerKey={mapTilerKey}
                onActiveColumnsChange={this.handleSampleActiveColumnsChange}
                onClearFilters={this.handleClearFilters}
                onDisplaySwitch={this.handleDisplaySwitch}
                onLoadRows={samples.handleLoadObjectRows}
                onMapClick={this.clearMapPreview}
                onMapLevelChange={this.handleMapLevelChange}
                onMapMarkerClick={this.handleMapMarkerClick}
                onMapTooltipTitleClick={this.handleMapTooltipTitleClick}
                onSampleSelected={this.handleSampleSelected}
                onSelectedSamplesUpdate={this.handleSelectedSamplesUpdate}
                projectId={projectId}
                ref={samplesView => (this.samplesView = samplesView)}
                samples={samples}
                selectableIds={selectableSampleIds}
                selectedSampleIds={selectedSampleIds}
              />
            </div>
            {!samples.length &&
              !samples.isLoading() &&
              currentDisplay === "table" &&
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
      projectDimensions,
      project,
      sampleDimensions,
      search,
      showStats,
      userDataCounts,
    } = this.state;
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
          (currentDisplay === "map" ? (
            <MapPreviewSidebar
              allowedFeatures={allowedFeatures}
              currentTab={mapSidebarTab}
              discoveryCurrentTab={currentTab}
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
                !mapPreviewedLocationId
                  ? computedSampleDimensions
                  : mapSidebarSampleDimensions
              }
              samples={this.mapPreviewSamples}
              sampleStats={
                !mapPreviewedLocationId
                  ? {
                      ...filteredSampleStats,
                      count: filteredSampleCount,
                    }
                  : {
                      ...mapSidebarSampleStats,
                      count: mapSidebarSampleCount,
                    }
              }
              selectedSampleIds={selectedSampleIds}
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
              projectStats={{
                count: filteredProjectCount,
              }}
              sampleDimensions={computedSampleDimensions}
              sampleStats={{
                ...filteredSampleStats,
                count: filteredSampleCount,
              }}
              project={project}
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
    const { domain, allowedFeatures } = this.props;

    const tabs = this.computeTabs();
    const dimensions = this.getCurrentDimensions();
    const filterCount = this.getFilterCount();

    return (
      <div className={cs.layout}>
        <div className={cs.headerContainer}>
          {projectId && (
            <ProjectHeader
              project={project || {}}
              fetchedSamples={this.samples.loaded}
              onProjectUpdated={this.handleProjectUpdated}
              onMetadataUpdated={this.refreshDataFromProjectChange}
            />
          )}
          <DiscoveryHeader
            currentTab={currentTab}
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
            {showFilters &&
              dimensions && (
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
          </div>
          {this.renderRightPane()}
        </div>
      </div>
    );
  }
}

DiscoveryView.propTypes = {
  domain: PropTypes.oneOf([
    DISCOVERY_DOMAIN_ALL_DATA,
    DISCOVERY_DOMAIN_MY_DATA,
    DISCOVERY_DOMAIN_PUBLIC,
  ]).isRequired,
  projectId: PropTypes.number,
  allowedFeatures: PropTypes.arrayOf(PropTypes.string),
  mapTilerKey: PropTypes.string,
  admin: PropTypes.bool,
};

DiscoveryView.contextType = UserContext;

export default DiscoveryView;
