import React from "react";
import PropTypes from "prop-types";
import { sumBy } from "lodash";

import NarrowContainer from "~/components/layout/NarrowContainer";
import { Divider } from "~/components/layout";
import { getSamples, getProjects } from "~/api";
import DiscoveryHeader from "../discovery/DiscoveryHeader";
import ProjectsView from "../projects/ProjectsView";
import SamplesView from "../samples/SamplesView";
import VisualizationsView from "../visualizations/VisualizationsView";

import { sumBy } from "lodash";
import { getSamples, getProjects, getVisualizations } from "~/api";

import cs from "./discovery_view.scss";

class DiscoveryView extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      currentTab: "samples",
      samples: [],
      projects: [],
      visualizations: []
    };
    this.fetchData();
  }

  async fetchData() {
    const { onlyLibrary, excludeLibrary } = this.props;
    try {
      const [samples, projects, visualizations] = await Promise.all([
        getSamples({ onlyLibrary, excludeLibrary }),
        getProjects({ onlyLibrary, excludeLibrary }),
        getVisualizations({ onlyLibrary, excludeLibrary })
      ]);
      this.setState({
        samples,
        projects,
        visualizations
      });
    } catch (error) {
      // TODO: handle error better
      // eslint-disable-next-line no-console
      console.log(error);
    }
  }

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
        label: renderTab("Samples", sumBy(projects, "number_of_samples")),
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

  render() {
    const { currentTab, projects, visualizations } = this.state;
    const { onlyLibrary, excludeLibrary } = this.props;
    const tabs = this.computeTabs(projects, visualizations);

    return (
      <div className={cs.layout}>
        <NarrowContainer className={cs.headerContainer}>
          <DiscoveryHeader
            initialTab={currentTab}
            tabs={tabs}
            onTabChange={this.handleTabChange}
          />
        </NarrowContainer>
        <Divider style="medium" />
        <NarrowContainer className={cs.viewContainer}>
          {currentTab == "projects" && <ProjectsView projects={projects} />}
          {currentTab == "samples" && (
            <SamplesView
              onlyLibrary={onlyLibrary}
              excludeLibrary={excludeLibrary}
            />
          )}
          {currentTab == "visualizations" && (
            <VisualizationsView visualizations={visualizations} />
          )}
        </NarrowContainer>
      </div>
    );
  }
}

DiscoveryView.propTypes = {
  excludeLibrary: PropTypes.bool,
  onlyLibrary: PropTypes.bool
};

export default DiscoveryView;
