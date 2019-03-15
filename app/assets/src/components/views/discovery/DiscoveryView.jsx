import React from "react";
import PropTypes from "prop-types";
import moment from "moment";
import {
  flow,
  keyBy,
  map,
  mapKeys,
  mapValues,
  replace,
  sumBy,
  values
} from "lodash/fp";
import NarrowContainer from "~/components/layout/NarrowContainer";
import { Divider } from "~/components/layout";
import DiscoveryHeader from "../discovery/DiscoveryHeader";
import ProjectsView from "../projects/ProjectsView";
import SamplesView from "../samples/SamplesView";
import VisualizationsView from "../visualizations/VisualizationsView";
import DiscoverySidebar from "./DiscoverySidebar";
import cs from "./discovery_view.scss";
import cx from "classnames";
import DiscoveryFilters from "./DiscoveryFilters";
import {
  getDiscoveryData,
  getDiscoveryDimensions,
  getDiscoverySamples,
  DISCOVERY_DOMAIN_LIBRARY,
  DISCOVERY_DOMAIN_PUBLIC
} from "./discovery_api";

class DiscoveryView extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      currentTab: "projects",
      dimensions: [],
      filters: {},
      filterCount: 0,
      projects: [],
      sampleIds: [],
      samples: [],
      samplesAllLoaded: false,
      showFilters: true,
      showStats: true,
      visualizations: []
    };

    this.data = null;
  }

  componentDidMount() {
    this.refreshData();
    this.refreshDimensions();
  }

  preparedFilters = () => {
    const { filters } = this.state;

    let preparedFilters = flow([
      mapKeys(key => replace("Selected", "", key)),
      mapValues(
        values =>
          !values
            ? null
            : Array.isArray(values)
              ? map("value", values)
              : values.value
      )
    ])(filters);

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

    return preparedFilters;
  };

  resetData = () => {
    this.setState(
      {
        projects: [],
        sampleIds: [],
        samples: [],
        samplesAllLoaded: false
      },
      () => {
        this.refreshData();
        this.samplesView && this.samplesView.reset();
      }
    );
  };

  refreshData = async () => {
    const { domain } = this.props;

    const {
      projects = [],
      samples = [],
      sampleIds = [],
      visualizations = []
    } = await getDiscoveryData({
      domain,
      filters: this.preparedFilters()
    });

    this.setState({
      projects,
      samples,
      sampleIds,
      visualizations
    });
  };

  refreshDimensions = async () => {
    const { domain } = this.props;

    const {
      projectDimensions = {},
      sampleDimensions = {}
    } = await getDiscoveryDimensions({ domain });

    this.setState({ projectDimensions, sampleDimensions });
  };

  computeTabs = (projects, visualizations) => {
    const renderTab = (label, count) => {
      return (
        <div>
          <span className={cs.tabLabel}>{label}</span>
          <span className={cs.tabCounter}>{count}</span>
        </div>
      );
    };

    return [
      {
        label: renderTab("Projects", (projects || []).length),
        value: "projects"
      },
      {
        label: renderTab("Samples", sumBy("number_of_samples", projects)),
        value: "samples"
      },
      {
        label: renderTab("Visualizations", (visualizations || []).length),
        value: "visualizations"
      }
    ];
  };

  handleTabChange = currentTab => {
    this.setState({ currentTab });
  };

  handleFilterChange = selectedFilters => {
    const filterCount = sumBy(
      filters => (Array.isArray(filters) ? filters.length : !filters ? 0 : 1),
      values(selectedFilters)
    );
    this.setState(
      {
        filters: selectedFilters,
        filterCount
      },
      () => this.resetData()
    );
  };

  handleFilterToggle = () => {
    this.setState({ showFilters: !this.state.showFilters });
  };

  handleStatsToggle = () => {
    this.setState({ showStats: !this.state.showStats });
  };

  handleLoadSampleRows = async ({ startIndex, stopIndex }) => {
    const { domain } = this.props;
    const { samples, samplesAllLoaded } = this.state;

    const previousLoadedSamples = samples.slice(startIndex, stopIndex + 1);
    const neededStartIndex = Math.max(startIndex, samples.length);

    let newlyFetchedSamples = [];
    if (!samplesAllLoaded && stopIndex >= neededStartIndex) {
      const numRequestedSamples = stopIndex - neededStartIndex + 1;
      let { samples: fetchedSamples } = await getDiscoverySamples({
        domain,
        filters: this.preparedFilters(),
        limit: stopIndex - neededStartIndex + 1,
        offset: neededStartIndex
      });

      this.setState({
        // add newly fetched samples to the list (assumes that samples are requested in order)
        samples: samples.concat(fetchedSamples),
        // if returned samples are less than requested, we assume all data was loaded
        samplesAllLoaded: fetchedSamples.length < numRequestedSamples
      });
      newlyFetchedSamples = fetchedSamples;
    }

    return previousLoadedSamples.concat(newlyFetchedSamples);
  };

  render() {
    const {
      currentTab,
      projectDimensions,
      sampleDimensions,
      filterCount,
      projects,
      sampleIds,
      samples,
      showFilters,
      showStats,
      visualizations
    } = this.state;
    const tabs = this.computeTabs(projects, visualizations);

    let dimensions = {
      projects: projectDimensions,
      samples: sampleDimensions
    }[currentTab];

    return (
      <div className={cs.layout}>
        <DiscoveryHeader
          initialTab={currentTab}
          tabs={tabs}
          onTabChange={this.handleTabChange}
          filterCount={filterCount}
          onFilterToggle={this.handleFilterToggle}
          onStatsToggle={this.handleStatsToggle}
        />
        <Divider style="medium" />
        <div className={cs.mainContainer}>
          <div className={cs.leftPane}>
            <DiscoveryFilters
              className={cx(showFilters || cs.hiddenPane)}
              {...mapValues(dim => dim.values, keyBy("dimension", dimensions))}
              onFilterChange={this.handleFilterChange}
            />
          </div>
          <NarrowContainer className={cs.viewContainer}>
            {currentTab == "projects" && <ProjectsView projects={projects} />}
            {currentTab == "samples" && (
              <SamplesView
                ref={samplesView => (this.samplesView = samplesView)}
                onLoadRows={this.handleLoadSampleRows}
                selectableIds={sampleIds}
              />
            )}
            {currentTab == "visualizations" && (
              <VisualizationsView visualizations={visualizations} />
            )}
          </NarrowContainer>
          <div className={cs.rightPane}>
            {["samples", "projects"].includes(currentTab) && (
              <DiscoverySidebar
                className={cx(cs.sidebar, showStats || cs.hiddenPane)}
                samples={samples}
                projects={projects}
                currentTab={currentTab}
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
    .isRequired
};

export default DiscoveryView;
