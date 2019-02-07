import React from "react";
import PropTypes from "prop-types";
import NarrowContainer from "~/components/layout/NarrowContainer";
import { Divider } from "~/components/layout";
import DiscoveryHeader from "../discovery/DiscoveryHeader";
import ProjectsView from "../projects/ProjectsView";
import { sumBy } from "lodash";
import { getSamples, getProjects } from "~/api";
import cs from "./discovery_view.scss";

class DiscoveryView extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      currentTab: "projects",
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
    const tabs = this.computeTabs(projects);

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
            <div>
              Not implemented yet. <a href="/samples">Current samples view</a>
            </div>
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
