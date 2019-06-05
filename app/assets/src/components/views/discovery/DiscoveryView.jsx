import React from "react";
import PropTypes from "prop-types";
import UrlQueryParser from "~/components/utils/UrlQueryParser";
import moment from "moment";
import {
  capitalize,
  clone,
  compact,
  concat,
  defaults,
  escapeRegExp,
  find,
  findIndex,
  keyBy,
  map,
  mapKeys,
  mapValues,
  merge,
  pick,
  replace,
  sumBy,
  values,
  xor,
  xorBy
} from "lodash/fp";

import { getSearchSuggestions } from "~/api";
import { logAnalyticsEvent } from "~/api/analytics";
import { openUrl } from "~utils/links";
import NarrowContainer from "~/components/layout/NarrowContainer";
import { Divider } from "~/components/layout";

import DiscoveryHeader from "./DiscoveryHeader";
import ProjectsView from "../projects/ProjectsView";
import SamplesView from "../samples/SamplesView";
import VisualizationsView from "../visualizations/VisualizationsView";
import DiscoverySidebar from "./DiscoverySidebar";
import DiscoveryFilters from "./DiscoveryFilters";
import ProjectHeader from "./ProjectHeader";
import {
  getDiscoverySyncData,
  getDiscoveryDimensions,
  getDiscoveryStats,
  getDiscoverySamples,
  getDiscoveryLocations,
  DISCOVERY_DOMAIN_ALL_DATA,
  DISCOVERY_DOMAIN_MY_DATA,
  DISCOVERY_DOMAIN_PUBLIC
} from "./discovery_api";
import NoResultsBanner from "./NoResultsBanner";
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
  constructor(props) {
    super(props);

    const { projectId } = this.props;

    this.urlParser = new UrlQueryParser({
      filters: "object",
      projectId: "number",
      showFilters: "boolean",
      showStats: "boolean"
    });

    const urlState = this.urlParser.parse(location.search);

    this.state = defaults(
      {
        currentDisplay: "table",
        currentTab: projectId ? "samples" : "projects",
        filteredProjectDimensions: [],
        filteredSampleDimensions: [],
        filteredSampleStats: {},
        filters: {},
        loadingDimensions: true,
        loadingLocations: true,
        loadingProjects: true,
        loadingSamples: true,
        loadingStats: true,
        loadingVisualizations: true,
        mapLocationData: {},
        mapSelectedLocationId: null,
        mapSelectedSampleIds: [],
        mapSelectedSamples: [],
        project: null,
        projectDimensions: [],
        projectId: projectId,
        projects: [],
        sampleDimensions: [],
        sampleIds: [],
        samples: [],
        samplesAllLoaded: false,
        search: null,
        showFilters: true,
        showStats: true,
        visualizations: []
      },
      urlState
    );

    this.data = null;
    this.updateBrowsingHistory("replace");
  }

  async componentDidMount() {
    this.resetDataFromInitialLoad();

    window.onpopstate = () => {
      this.setState(history.state, () => {
        this.resetDataFromInitialLoad();
      });
    };
  }

  updateBrowsingHistory = (action = "push") => {
    const { domain } = this.props;

    const urlFields = [
      "currentTab",
      "filters",
      "projectId",
      "search",
      "showFilters",
      "showStats"
    ];
    const stateFields = concat(urlFields, ["project"]);

    const historyState = pick(stateFields, this.state);
    const urlState = pick(urlFields, this.state);

    let urlQuery = this.urlParser.stringify(urlState);
    if (urlQuery) {
      urlQuery = `?${urlQuery}`;
    }

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
        "1_year": () => moment().subtract(1, "years")
      };

      preparedFilters.time = [
        startDate[preparedFilters.time]().format("YYYYMMDD"),
        moment()
          .add(1, "days")
          .format("YYYYMMDD")
      ];
    }

    // Taxon is an exception: this filter needs to store complete option, so need to convert to values only
    if (preparedFilters.taxon && preparedFilters.taxon.length) {
      preparedFilters.taxon = map("value", preparedFilters.taxon);
    }

    return preparedFilters;
  };

  resetData = ({ callback }) => {
    const { project } = this.state;

    this.setState(
      {
        filteredProjectDimensions: [],
        filteredSampleDimensions: [],
        filteredSampleStats: {},
        loadingDimensions: true,
        loadingSamples: true,
        // instead of resetting projects we use the current project info, if selected
        projects: compact([project]),
        sampleIds: [],
        samples: [],
        samplesAllLoaded: false,
        visualizations: []
      },
      () => {
        this.samplesView && this.samplesView.reset();
        callback && callback();
      }
    );
  };

  resetDataFromInitialLoad = () => {
    const { project } = this.state;
    this.resetData({
      callback: () => {
        // * Initial load:
        //   - load (A) non-filtered dimensions, (C) filtered stats, (D) filtered locations, and (E) synchronous table data
        this.refreshDimensions();
        this.refreshFilteredStats();
        this.refreshFilteredLocations();
        this.refreshSynchronousData();
        //   * if filter or project is set
        //     - load (B) filtered dimensions
        (this.getFilterCount() || project) && this.refreshFilteredDimensions();
      }
    });
  };

  resetDataFromFilterChange = () => {
    const { project } = this.state;
    this.resetData({
      callback: () => {
        // * On filter change:
        //   - load (B) filtered dimensions, (C) filtered stats, (D) filtered locations
        this.refreshFilteredDimensions();
        this.refreshFilteredStats();
        this.refreshFilteredLocations();
        //  * if project not set
        //       load (E) synchronous table data
        !project && this.refreshSynchronousData();
      }
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
      }
    });
  };

  refreshSynchronousData = async () => {
    const { domain } = this.props;
    const { projectId, search } = this.state;

    this.setState({
      loadingProjects: true,
      loadingVisualizations: true,
      loadingSamples: true
    });

    const { projects = [], visualizations = [] } = await getDiscoverySyncData({
      domain,
      filters: this.preparedFilters(),
      projectId: projectId,
      search
    });

    this.setState({
      project: projectId ? projects[0] : null,
      projects,
      visualizations,
      loadingProjects: false,
      loadingVisualizations: false
    });
  };

  refreshDimensions = async () => {
    const { domain } = this.props;
    const { projectId } = this.state;

    this.setState({
      loadingDimensions: true
    });

    const {
      projectDimensions,
      sampleDimensions
    } = await getDiscoveryDimensions({
      domain,
      projectId
    });

    this.setState({
      projectDimensions,
      sampleDimensions,
      loadingDimensions: false
    });
  };

  refreshFilteredStats = async () => {
    const { domain } = this.props;
    const { projectId, search } = this.state;

    this.setState({
      loadingStats: true
    });

    const { sampleStats: filteredSampleStats } = await getDiscoveryStats({
      domain,
      projectId,
      filters: this.preparedFilters(),
      search
    });

    this.setState({
      filteredSampleStats,
      loadingStats: false
    });
  };

  refreshFilteredDimensions = async () => {
    const { domain } = this.props;
    const { projectId, search } = this.state;

    this.setState({
      loadingDimensions: true
    });

    const {
      projectDimensions: filteredProjectDimensions,
      sampleDimensions: filteredSampleDimensions
    } = await getDiscoveryDimensions({
      domain,
      projectId,
      filters: this.preparedFilters(),
      search
    });

    this.setState({
      filteredProjectDimensions,
      filteredSampleDimensions,
      loadingDimensions: false
    });
  };

  refreshFilteredLocations = async () => {
    const { domain } = this.props;
    const { projectId, search } = this.state;

    this.setState({
      loadingLocations: true
    });

    const mapLocationData = await getDiscoveryLocations({
      domain,
      projectId,
      filters: this.preparedFilters(),
      search
    });

    this.setState({ mapLocationData, loadingLocations: false });
  };

  computeTabs = () => {
    const { domain } = this.props;
    const {
      projectId,
      projects,
      visualizations,
      filteredSampleStats
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
        label: renderTab("Projects", (projects || []).length),
        value: "projects"
      },
      {
        label: renderTab("Samples", filteredSampleStats.count || 0),
        value: "samples"
      },
      domain !== DISCOVERY_DOMAIN_PUBLIC &&
        !projectId && {
          label: renderTab("Visualizations", (visualizations || []).length),
          value: "visualizations"
        }
    ]);
  };

  handleTabChange = currentTab => {
    this.setState({ currentTab }, () => {
      this.updateBrowsingHistory("replace");
      const name = currentTab.replace(/\W+/g, "-").toLowerCase();
      logAnalyticsEvent(`DiscoveryView_tab-${name}_clicked`, {
        currentTab: currentTab
      });
    });
  };

  handleFilterChange = selectedFilters => {
    this.setState({ filters: selectedFilters }, () => {
      this.updateBrowsingHistory("replace");
      this.resetDataFromFilterChange();
      logAnalyticsEvent(`DiscoveryView_filters_changed`, {
        filters: this.getFilterCount()
      });
    });
  };

  handleSearchSelected = ({ key, value, text }, currentEvent) => {
    const { filters, projects, search } = this.state;

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
        const project = find({ id: value }, projects);
        if (project) {
          this.handleProjectSelected({ project });
        }
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
          search: null
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
      filtersChanged
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
          search: parsedSearch
        });
      });
    }
  };

  handleFilterToggle = () => {
    this.setState({ showFilters: !this.state.showFilters }, () => {
      this.updateBrowsingHistory("replace");
      logAnalyticsEvent("DiscoveryView_show-filters_toggled", {
        showFilters: this.state.showFilters
      });
    });
  };

  handleStatsToggle = () => {
    this.setState({ showStats: !this.state.showStats }, () => {
      this.updateBrowsingHistory("replace");
      logAnalyticsEvent("DiscoveryView_show-stats_toggled", {
        showFilters: this.state.showStats
      });
    });
  };

  handleLoadSampleRows = async ({ startIndex, stopIndex }) => {
    const { domain } = this.props;
    const {
      projectId,
      samples,
      sampleIds,
      samplesAllLoaded,
      search
    } = this.state;

    const previousLoadedSamples = samples.slice(startIndex, stopIndex + 1);
    const neededStartIndex = Math.max(startIndex, samples.length);

    let newlyFetchedSamples = [];
    if (!samplesAllLoaded && stopIndex >= neededStartIndex) {
      const numRequestedSamples = stopIndex - neededStartIndex + 1;
      let {
        samples: fetchedSamples,
        sampleIds: fetchedSampleIds
      } = await getDiscoverySamples({
        domain,
        filters: this.preparedFilters(),
        projectId,
        search,
        limit: stopIndex - neededStartIndex + 1,
        offset: neededStartIndex,
        listAllIds: sampleIds.length === 0
      });

      let newState = {
        // add newly fetched samples to the list (assumes that samples are requested in order)
        samples: samples.concat(fetchedSamples),
        // if returned samples are less than requested, we assume all data was loaded
        samplesAllLoaded: fetchedSamples.length < numRequestedSamples,
        loadingSamples: false
      };
      if (fetchedSampleIds) {
        newState.sampleIds = fetchedSampleIds;
      }

      this.setState(newState);
      newlyFetchedSamples = fetchedSamples;
    }

    return previousLoadedSamples.concat(newlyFetchedSamples);
  };

  handleProjectSelected = ({ project }) => {
    this.setState(
      {
        currentTab: "samples",
        project,
        projectId: project.id,
        search: null
      },
      () => {
        this.updateBrowsingHistory();
        this.refreshDataFromProjectChange();
      }
    );
  };

  handleSampleSelected = ({ sample, currentEvent }) => {
    openUrl(`/samples/${sample.id}`, currentEvent);
  };

  handleProjectUpdated = ({ project }) => {
    const { projects } = this.state;
    const projectIndex = findIndex({ id: project.id }, projects);
    let newProjects = projects.slice();
    newProjects.splice(projectIndex, 1, project);
    this.setState({
      project,
      projects: newProjects
    });
  };

  getCurrentDimensions = () => {
    const { currentTab, projectDimensions, sampleDimensions } = this.state;

    return {
      projects: projectDimensions,
      samples: sampleDimensions
    }[currentTab];
  };

  getClientSideSuggestions = async query => {
    const { projects } = this.state;
    const dimensions = this.getCurrentDimensions();

    let suggestions = {};
    const re = new RegExp(escapeRegExp(query), "i");
    ["host", "tissue", "location"].forEach(category => {
      let dimension = find({ dimension: category }, dimensions);
      if (dimension) {
        const results = dimension.values
          .filter(entry => re.test(entry.text))
          .map(entry => ({
            category,
            id: entry.value,
            title: entry.text
          }));

        if (results.length) {
          suggestions[category] = {
            name: capitalize(category),
            results
          };
        }
      }
    });

    const filteredProjects = projects.filter(project => re.test(project.name));
    if (filteredProjects.length) {
      suggestions["project"] = {
        name: "Project",
        results: filteredProjects.map(project => ({
          category: "project",
          title: project.name,
          id: project.id
        }))
      };
    }

    return suggestions;
  };

  getServerSideSuggestions = async query => {
    const { domain } = this.props;

    let results = await getSearchSuggestions({
      categories: ["sample", "taxon"],
      query,
      domain
    });
    return results;
  };

  handleSearchTriggered = async query => {
    const [clientSideSuggestions, serverSideSuggestions] = await Promise.all([
      // client side: for dimensions (host, location, tissue) and projects search
      this.getClientSideSuggestions(query),
      // server side: for taxa and samples search (filter by domain)
      this.getServerSideSuggestions(query)
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
    this.setState({ currentDisplay });
  };

  handleMapTooltipTitleClick = locationId => {
    this.setState({ mapSelectedLocationId: locationId }, () =>
      this.refreshMapSelectedSamples()
    );
  };

  refreshMapSelectedSamples = async () => {
    const { mapSelectedLocationId, mapLocationData } = this.state;
    const sampleIds = mapLocationData[mapSelectedLocationId].sample_ids;

    // TODO(jsheu): Consider paginating fetching for thousands of samples at a location
    const {
      samples: fetchedSamples,
      sampleIds: fetchedSampleIds
    } = await getDiscoverySamples({
      sampleIds,
      limit: 1e4, // Server needs a max, 1e4 at one location is a good cutoff.
      listAllIds: true
    });
    this.setState(
      {
        mapSelectedSamples: fetchedSamples,
        mapSelectedSampleIds: fetchedSampleIds
      },
      () => {
        this.mapPreviewSidebar && this.mapPreviewSidebar.reset();
      }
    );
  };

  renderRightPane = () => {
    const {
      currentDisplay,
      currentTab,
      filteredProjectDimensions,
      filteredSampleDimensions,
      filteredSampleStats,
      loadingDimensions,
      loadingStats,
      mapSelectedSampleIds,
      mapSelectedSamples,
      projectDimensions,
      projects,
      sampleDimensions,
      samples,
      search,
      showStats
    } = this.state;

    const filterCount = this.getFilterCount();

    return (
      <div className={cs.rightPane}>
        {showStats &&
          ["samples", "projects"].includes(currentTab) &&
          (currentDisplay === "table" ? (
            <DiscoverySidebar
              className={cs.sidebar}
              samples={samples}
              projects={projects}
              sampleDimensions={
                filterCount || search
                  ? filteredSampleDimensions
                  : sampleDimensions
              }
              sampleStats={filteredSampleStats}
              projectDimensions={
                filterCount || search
                  ? filteredProjectDimensions
                  : projectDimensions
              }
              currentTab={currentTab}
              loading={loadingDimensions || loadingStats}
            />
          ) : (
            <MapPreviewSidebar
              samples={mapSelectedSamples}
              onSampleSelected={this.handleSampleSelected}
              selectableIds={mapSelectedSampleIds}
              ref={mapPreviewSidebar =>
                (this.mapPreviewSidebar = mapPreviewSidebar)
              }
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
      loadingProjects,
      loadingSamples,
      loadingVisualizations,
      mapLocationData,
      project,
      projectId,
      projects,
      sampleIds,
      samples,
      search,
      showFilters,
      showStats,
      visualizations
    } = this.state;

    const { domain, allowedFeatures, mapTilerKey } = this.props;

    const tabs = this.computeTabs();
    const dimensions = this.getCurrentDimensions();
    const filterCount = this.getFilterCount();

    return (
      <div className={cs.layout}>
        <div className={cs.headerContainer}>
          {projectId && (
            <ProjectHeader
              project={project || {}}
              fetchedSamples={samples}
              onProjectUpdated={this.handleProjectUpdated}
              newSampleUpload={allowedFeatures.includes("new_sample_upload")}
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
                />
              )}
          </div>
          <div className={cs.centerPane}>
            <NarrowContainer className={cs.viewContainer}>
              {currentTab === "projects" && (
                <div className={cs.tableContainer}>
                  <div className={cs.dataContainer}>
                    <ProjectsView
                      projects={projects}
                      onProjectSelected={this.handleProjectSelected}
                    />
                  </div>
                  {!projects.length &&
                    !loadingProjects && (
                      <NoResultsBanner
                        className={cs.noResultsContainer}
                        type="projects"
                      />
                    )}
                </div>
              )}
              {currentTab === "samples" && (
                <div className={cs.tableContainer}>
                  <div className={cs.dataContainer}>
                    <SamplesView
                      allowedFeatures={allowedFeatures}
                      currentDisplay={currentDisplay}
                      mapLocationData={mapLocationData}
                      mapTilerKey={mapTilerKey}
                      onDisplaySwitch={this.handleDisplaySwitch}
                      onLoadRows={this.handleLoadSampleRows}
                      onMapTooltipTitleClick={this.handleMapTooltipTitleClick}
                      onSampleSelected={this.handleSampleSelected}
                      projectId={projectId}
                      ref={samplesView => (this.samplesView = samplesView)}
                      samples={samples}
                      selectableIds={sampleIds}
                    />
                  </div>
                  {!samples.length &&
                    !loadingSamples && (
                      <NoResultsBanner
                        className={cs.noResultsContainer}
                        type="samples"
                      />
                    )}
                </div>
              )}
              {currentTab === "visualizations" && (
                <div className={cs.tableContainer}>
                  <div className={cs.dataContainer}>
                    <VisualizationsView visualizations={visualizations} />
                  </div>
                  {!visualizations.length &&
                    !loadingVisualizations && (
                      <NoResultsBanner
                        className={cs.noResultsContainer}
                        type="visualizations"
                      />
                    )}
                </div>
              )}
            </NarrowContainer>
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
    DISCOVERY_DOMAIN_PUBLIC
  ]).isRequired,
  projectId: PropTypes.number,
  allowedFeatures: PropTypes.arrayOf(PropTypes.string),
  mapTilerKey: PropTypes.string
};

export default DiscoveryView;
