import React from "react";
import PropTypes from "prop-types";
import NarrowContainer from "~/components/layout/NarrowContainer";
import { Divider } from "~/components/layout";
import DiscoveryHeader from "../discovery/DiscoveryHeader";
import ProjectsView from "../projects/ProjectsView";
import SamplesView from "../samples/SamplesView";
import { sumBy } from "lodash";
import { getSamples, getProjects } from "~/api";
import cs from "./discovery_view.scss";
import LabeledDropdown from "../../ui/controls/dropdowns/LabeledDropdown";
import MultipleDropdown from "../../ui/controls/dropdowns/MultipleDropdown";
import AsyncFilter from "../../common/filters/AsyncFilter";

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

  handleFilterSelectionChange = selectedOptions => {
    console.log("handleFilterSelectionChange", selectedOptions);
  };

  render() {
    const { currentTab, projects } = this.state;
    const { onlyLibrary, excludeLibrary } = this.props;
    const tabs = this.computeTabs(projects);

    let options = [
      { value: "value_1", text: "Value 1" },
      { value: "value_2", text: "Value 2" },
      { value: "value_3", text: "Value 3" }
    ];
    let value = ["value_2"];

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
        <div className={cs.mainContainer}>
          <div className={cs.leftPane}>
            <AsyncFilter label="Pathogen" menuLabel="Select Pathogen" />
            {/* <LabeledDropdown>
                <MultipleDropdown
                  hideCounter
                  rounded
                  search
                  checkedOnTop
                  menuLabel="Select Columns"
                  onChange={this.handleFilterSelectionChange}
                  value={value}
                  options={options}
                />
              </LabeledDropdown> */}
          </div>
          <NarrowContainer className={cs.viewContainer}>
            {currentTab == "projects" && <ProjectsView projects={projects} />}
            {currentTab == "samples" && (
              <SamplesView
                onlyLibrary={onlyLibrary}
                excludeLibrary={excludeLibrary}
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
  excludeLibrary: PropTypes.bool,
  onlyLibrary: PropTypes.bool
};

export default DiscoveryView;
