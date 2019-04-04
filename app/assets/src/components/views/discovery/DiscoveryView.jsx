import React from "react";
import PropTypes from "prop-types";
import moment from "moment";
import {
  assign,
  clone,
  compact,
  find,
  findIndex,
  keyBy,
  map,
  mapKeys,
  mapValues,
  pick,
  replace,
  sumBy,
  values,
  xor,
  xorBy
} from "lodash/fp";
import NarrowContainer from "~/components/layout/NarrowContainer";
import { Divider } from "~/components/layout";
import DiscoveryHeader from "../discovery/DiscoveryHeader";
import ProjectsView from "../projects/ProjectsView";
import SamplesView from "../samples/SamplesView";
import VisualizationsView from "../visualizations/VisualizationsView";
import DiscoverySidebar from "./DiscoverySidebar";
import cs from "./discovery_view.scss";
import DiscoveryFilters from "./DiscoveryFilters";
import ProjectHeader from "./ProjectHeader";
import {
  getDiscoverySyncData,
  getDiscoveryDimensions,
  getDiscoveryStats,
  getDiscoverySamples,
  DISCOVERY_DOMAIN_LIBRARY,
  DISCOVERY_DOMAIN_PUBLIC
} from "./discovery_api";
import NoResultsBanner from "./NoResultsBanner";
import { openUrl } from "~utils/links";

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

    this.state = assign(
      {
        currentTab: "projects",
        filteredProjectDimensions: [],
        filteredSampleDimensions: [],
        filteredSampleStats: {},
        filters: {},
        loadingProjects: true,
        loadingVisualizations: true,
        loadingSamples: true,
        loadingDimensions: true,
        loadingStats: true,
        project: this.props.project,
        projectDimensions: [],
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
      history.state
    );

    this.data = null;
    this.updateBrowsingHistory("replace");
  }

  componentDidMount() {
    this.resetDataFromInitialLoad();

    window.onpopstate = () => {
      this.setState(history.state, () => {
        this.resetDataFromInitialLoad();
      });
    };
  }

  updateBrowsingHistory = (action = "push") => {
    const { domain } = this.props;
    const historyState = pick(
      ["currentTab", "filters", "project", "showFilters", "showStats"],
      this.state
    );

    if (action === "push") {
      history.pushState(historyState, `DiscoveryView:${domain}`, `/${domain}`);
    } else {
      history.replaceState(
        historyState,
        `DiscoveryView:${domain}`,
        `/${domain}`
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
        moment().format("YYYYMMDD")
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
        //   - load (A) non-filtered dimensions, (C) filtered stats and (D) synchronous table data
        this.refreshDimensions();
        this.refreshFilteredStats();
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
        //   - load (B) filtered dimensions, (C) filtered stats
        this.refreshFilteredDimensions();
        this.refreshFilteredStats();
        //  * if project not set
        //       load (D) synchronous table data
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
      }
    });
  };

  refreshSynchronousData = async () => {
    const { domain } = this.props;
    const { project, search } = this.state;

    this.setState({
      loadingProjects: true,
      loadingVisualizations: true,
      loadingSamples: true
    });

    const { projects = [], visualizations = [] } = await getDiscoverySyncData({
      domain,
      filters: this.preparedFilters(),
      projectId: project && project.id,
      search
    });

    this.setState({
      projects,
      visualizations,
      loadingProjects: false,
      loadingVisualizations: false
    });
  };

  refreshDimensions = async () => {
    const { domain } = this.props;
    const { project } = this.state;

    this.setState({
      loadingDimensions: true
    });

    const {
      projectDimensions,
      sampleDimensions
    } = await getDiscoveryDimensions({
      domain,
      projectId: project && project.id
    });

    this.setState({
      projectDimensions,
      sampleDimensions,
      loadingDimensions: false
    });
  };

  refreshFilteredStats = async () => {
    const { domain } = this.props;
    const { project, search } = this.state;

    this.setState({
      loadingStats: true
    });

    const { sampleStats: filteredSampleStats } = await getDiscoveryStats({
      domain,
      projectId: project && project.id,
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
    const { project, search } = this.state;

    this.setState({
      loadingDimensions: true
    });

    const {
      projectDimensions: filteredProjectDimensions,
      sampleDimensions: filteredSampleDimensions
    } = await getDiscoveryDimensions({
      domain,
      projectId: project && project.id,
      filters: this.preparedFilters(),
      search
    });

    this.setState({
      filteredProjectDimensions,
      filteredSampleDimensions,
      loadingDimensions: false
    });
  };

  computeTabs = () => {
    const {
      project,
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
      !project && {
        label: renderTab("Projects", (projects || []).length),
        value: "projects"
      },
      {
        label: renderTab("Samples", filteredSampleStats.count || 0),
        value: "samples"
      },
      !project && {
        label: renderTab("Visualizations", (visualizations || []).length),
        value: "visualizations"
      }
    ]);
  };

  handleTabChange = currentTab => {
    this.setState({ currentTab });
  };

  handleFilterChange = selectedFilters => {
    this.setState({ filters: selectedFilters }, () => {
      this.updateBrowsingHistory("replace");
      this.resetDataFromFilterChange();
    });
  };

  handleSearchSelected = ({ key, value, text }, currentEvent) => {
    const {
      currentTab,
      filters,
      projects,
      projectDimensions,
      sampleDimensions
    } = this.state;
    const dimensions = {
      projects: projectDimensions,
      samples: sampleDimensions
    }[currentTab];

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
        this.handleProjectSelected({ project });
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
    if (filtersChanged) {
      this.setState({ filters: newFilters }, () => {
        this.updateBrowsingHistory("replace");
        this.resetDataFromFilterChange();
      });
    }
  };

  handleStringSearch = search => {
    const { search: currentSearch } = this.state;

    let parsedSearch = search.trim() || null;
    if (currentSearch !== parsedSearch) {
      this.setState({ search: parsedSearch }, () => {
        this.updateBrowsingHistory("replace");
        this.resetDataFromFilterChange();
      });
    }
  };

  handleFilterToggle = () => {
    this.setState({ showFilters: !this.state.showFilters });
  };

  handleStatsToggle = () => {
    this.setState({ showStats: !this.state.showStats });
  };

  handleLoadSampleRows = async ({ startIndex, stopIndex }) => {
    const { domain } = this.props;
    const {
      project,
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
        projectId: project && project.id,
        search,
        limit: stopIndex - neededStartIndex + 1,
        offset: neededStartIndex,
        listAllIds: sampleIds.length == 0
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
        project
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

  getFilterCount = () => {
    const { filters } = this.state;
    return sumBy(
      filters => (Array.isArray(filters) ? filters.length : !filters ? 0 : 1),
      values(filters)
    );
  };

  render() {
    const {
      currentTab,
      filteredProjectDimensions,
      filteredSampleDimensions,
      filteredSampleStats,
      filters,
      loadingDimensions,
      loadingProjects,
      loadingVisualizations,
      loadingSamples,
      loadingStats,
      project,
      projectDimensions,
      projects,
      sampleDimensions,
      sampleIds,
      samples,
      search,
      showFilters,
      showStats,
      visualizations
    } = this.state;

    const tabs = this.computeTabs();

    let dimensions = {
      projects: projectDimensions,
      samples: sampleDimensions
    }[currentTab];

    const filterCount = this.getFilterCount();

    return (
      <div className={cs.layout}>
        <div className={cs.headerContainer}>
          {project && (
            <ProjectHeader
              project={project}
              fetchedSamples={samples}
              onProjectUpdated={this.handleProjectUpdated}
              newSampleUpload={this.props.allowedFeatures.includes(
                "new_sample_upload"
              )}
            />
          )}
          <DiscoveryHeader
            currentTab={currentTab}
            tabs={tabs}
            onTabChange={this.handleTabChange}
            filterCount={filterCount}
            onFilterToggle={this.handleFilterToggle}
            onStatsToggle={this.handleStatsToggle}
            onSearchResultSelected={this.handleSearchSelected}
            onSearchEnterPressed={this.handleStringSearch}
            showStats={showStats && !!dimensions}
            showFilters={showFilters && !!dimensions}
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
                  onFilterChange={this.handleFilterChange}
                />
              )}
          </div>
          <div className={cs.centerPane}>
            <NarrowContainer className={cs.viewContainer}>
              {currentTab == "projects" && (
                <div className={cs.tableContainer}>
                  <div className={cs.dataContainer}>
                    <ProjectsView
                      projects={projects}
                      onProjectSelected={this.handleProjectSelected}
                    />
                  </div>
                  {!projects.length &&
                    !loadingProjects && (
                      <NoResultsBanner className={cs.noResultsContainer} />
                    )}
                </div>
              )}
              {currentTab == "samples" && (
                <div className={cs.tableContainer}>
                  <div className={cs.dataContainer}>
                    <SamplesView
                      ref={samplesView => (this.samplesView = samplesView)}
                      onLoadRows={this.handleLoadSampleRows}
                      samples={samples}
                      selectableIds={sampleIds}
                      onSampleSelected={this.handleSampleSelected}
                    />
                  </div>
                  {!samples.length &&
                    !loadingSamples && (
                      <NoResultsBanner className={cs.noResultsContainer} />
                    )}
                </div>
              )}
              {currentTab == "visualizations" && (
                <div className={cs.tableContainer}>
                  <div className={cs.dataContainer}>
                    <VisualizationsView visualizations={visualizations} />
                  </div>
                  {!visualizations.length &&
                    !loadingVisualizations && (
                      <NoResultsBanner className={cs.noResultsContainer} />
                    )}
                </div>
              )}
            </NarrowContainer>
          </div>
          <div className={cs.rightPane}>
            {showStats &&
              ["samples", "projects"].includes(currentTab) && (
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
              )}
          </div>
        </div>
      </div>
    );
  }
}

DiscoveryView.propTypes = {
  domain: PropTypes.oneOf([DISCOVERY_DOMAIN_LIBRARY, DISCOVERY_DOMAIN_PUBLIC])
    .isRequired,
  project: PropTypes.object,
  allowedFeatures: PropTypes.arrayOf(PropTypes.string)
};

export default DiscoveryView;
