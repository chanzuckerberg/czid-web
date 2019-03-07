import React from "react";
import PropTypes from "prop-types";
import NarrowContainer from "~/components/layout/NarrowContainer";
import { Divider } from "~/components/layout";
import DiscoveryHeader from "../discovery/DiscoveryHeader";
import ProjectsView from "../projects/ProjectsView";
import SamplesView from "../samples/SamplesView";
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
import cs from "./discovery_view.scss";
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
      showFilters: true,
      currentTab: "samples",
      dimensions: [],
      samples: [],
      projects: [],
      filters: {},
      filterCount: 0
    };

    this.data = null;
  }

  componentDidMount() {
    this.refreshData();
    this.refreshDimensions();
  }

  preparedFilters = () => {
    // TODO: refactor DiscoveryFilters to simplify how we store filter state
    const { filters } = this.state;
    return flow([
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
  };

  resetData = () => {
    this.setState(
      {
        projects: [],
        samples: [],
        sampleIds: []
      },
      () => {
        this.refreshData();
        this.samplesView.reset();
      }
    );
  };

  refreshData = async () => {
    const { domain } = this.props;

    const {
      projects = [],
      samples = [],
      sampleIds = []
    } = await getDiscoveryData({
      domain,
      filters: this.preparedFilters()
    });

    this.setState({
      projects,
      samples,
      sampleIds
    });
    console.log("DiscoveryView:refreshData - projects", projects);
    console.log("DiscoveryView:refreshData - samples", samples);
    console.log("DiscoveryView:refreshData - sampleIds", sampleIds);
  };

  refreshDimensions = async () => {
    const { domain } = this.props;

    const dimensions = await getDiscoveryDimensions({ domain });

    if (dimensions) {
      this.setState({ dimensions });
    }

    console.log("dimensions", dimensions);
  };

  computeTabs = () => {
    const { projects, allSampleIds, analyses } = this.state;

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
        label: renderTab("Samples", (allSampleIds || []).length),
        value: "samples"
      },
      {
        label: renderTab("Analyses", (analyses || []).length),
        value: "analyses"
      }
    ];
  };

  handleTabChange = currentTab => {
    this.setState({ currentTab });
  };

  handleFilterChange = selectedFilters => {
    console.log("DiscoveryView:handleFilterChange - selected", selectedFilters);
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

  handleLoadSampleRows = async ({ startIndex, stopIndex }) => {
    const { domain } = this.props;
    const { samples } = this.state;

    console.log("DiscoveryView:handleLoadSampleRows", startIndex, stopIndex);
    const previousLoadedSamples = samples.slice(startIndex, stopIndex + 1);
    console.log("DiscoveryView:previouslyLoaded", previousLoadedSamples.length);
    const neededStartIndex = Math.max(startIndex, samples.length);
    console.log("DiscoveryView:neededStartIndex", neededStartIndex);

    let fetchedSamples = [];
    if (stopIndex >= neededStartIndex) {
      console.log("Calling getDiscoverySamples with ", {
        domain,
        filters: this.preparedFilters(),
        limit: stopIndex - neededStartIndex + 1,
        offset: neededStartIndex
      });
      const { samples } = await getDiscoverySamples({
        domain,
        filters: this.preparedFilters(),
        limit: stopIndex - neededStartIndex + 1,
        offset: neededStartIndex
      });
      fetchedSamples = samples;
      this.setState({
        samples: samples.concat(fetchedSamples)
      });
    }

    console.log("DiscoveryView:fetched", fetchedSamples.length);
    return previousLoadedSamples.concat(fetchedSamples);
  };

  render() {
    const {
      currentTab,
      dimensions,
      filterCount,
      projects,
      samples,
      showFilters
    } = this.state;
    const tabs = this.computeTabs();

    return (
      <div className={cs.layout}>
        <DiscoveryHeader
          initialTab={currentTab}
          tabs={tabs}
          onTabChange={this.handleTabChange}
          filterCount={filterCount}
          onFilterToggle={this.handleFilterToggle}
        />
        <Divider style="medium" />
        <div className={cs.mainContainer}>
          <div className={cs.leftPane}>
            {showFilters && (
              <DiscoveryFilters
                {...mapValues(
                  dim => dim.values,
                  keyBy("dimension", dimensions)
                )}
                onFilterChange={this.handleFilterChange}
              />
            )}
          </div>
          <NarrowContainer className={cs.viewContainer}>
            {currentTab == "projects" && <ProjectsView projects={projects} />}
            {currentTab == "samples" && (
              <SamplesView
                ref={samplesView => (this.samplesView = samplesView)}
                samples={samples}
                onLoadRows={this.handleLoadSampleRows}
              />
            )}
          </NarrowContainer>
          <div className={cs.rightPane} />
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
