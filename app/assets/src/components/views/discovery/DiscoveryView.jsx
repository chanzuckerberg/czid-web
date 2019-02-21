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

import cs from "./discovery_view.scss";

class DiscoveryView extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      currentTab: "samples",
      samples: [],
      projects: []
    };
    this.fetchData();
  }

  async fetchData() {
    const { onlyLibrary, excludeLibrary } = this.props;
    try {
      const [samples, projects] = await Promise.all([
        getSamples({ onlyLibrary, excludeLibrary }),
        getProjects({ onlyLibrary, excludeLibrary })
      ]);
      this.setState({
        samples,
        projects
      });
    } catch (error) {
      // TODO: handle error better
      // eslint-disable-next-line no-console
      console.log(error);
    }
  }

  computeTabs = (projects, analyses) => {
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
        label: renderTab("Analyses", (analyses || []).length),
        value: "analyses"
      }
    ];
  };

  handleTabChange = currentTab => {
    this.setState({ currentTab });
  };

  render() {
    const { currentTab, projects } = this.state;
    const { onlyLibrary, excludeLibrary } = this.props;
    const tabs = this.computeTabs(projects);

    // TODO (gdingle): fetch visualizations
    const visualizations = projects;
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
          {currentTab == "analyses" && (
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
