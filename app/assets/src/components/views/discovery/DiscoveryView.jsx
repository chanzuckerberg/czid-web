import React from "react";
import PropTypes from "prop-types";
import NarrowContainer from "~/components/layout/NarrowContainer";
import { Divider } from "~/components/layout";
import DiscoveryHeader from "../discovery/DiscoveryHeader";
import ProjectsView from "../projects/ProjectsView";
import { sumBy } from "lodash";
import { getSamples } from "~/api/samples";
import cs from "./discovery_view.scss";

class DiscoveryView extends React.Component {
  // TODO: add header nav
  // TODO: Filter by selection on header nav

  constructor(props) {
    super(props);

    this.state = {
      samples: [],
      projects: []
    };
    this.fetchData();
  }

  async fetchData() {
    try {
      const data = await getSamples();
      this.setState(data);
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

  handleTabChange = () => {
    console.log("TODO: handle tab change");
  };

  render() {
    const { projects } = this.state;
    const tabs = this.computeTabs(projects);

    return (
      <div className={cs.layout}>
        <NarrowContainer className={cs.headerContainer}>
          <DiscoveryHeader tabs={tabs} onTabChange={this.handleTabChange} />
        </NarrowContainer>
        <Divider style="medium" />
        <NarrowContainer className={cs.viewContainer}>
          <ProjectsView projects={projects} />
        </NarrowContainer>
      </div>
    );
  }
}

DiscoveryView.propTypes = {};

export default DiscoveryView;
