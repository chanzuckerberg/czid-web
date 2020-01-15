import React from "react";

import NarrowContainer from "~/components/layout/NarrowContainer";
import Tabs from "~/components/ui/controls/Tabs";
import GeoSearchInputBox from "~ui/controls/GeoSearchInputBox";
import HostOrganismMessage from "~/components/views/SampleUploadFlow/HostOrganismMessage";

import cs from "./playground_components.scss";

const TABS = ["Host Organism Message", "Geo Search Box"];

export default class PlaygroundComponents extends React.Component {
  state = {
    currentTab: TABS[0],
  };

  onTabChange = tab => {
    this.setState({ currentTab: tab });
  };

  handleResultSelected = ({ result }) => {
    // eslint-disable-next-line no-console
    console.log("PlaygroundComponents:handleResultSelected", result);
  };

  renderComponent = () => {
    const { currentTab } = this.state;

    if (currentTab === TABS[0]) {
      const hostGenomes = [{ name: "Human", id: 1 }];
      const samples = [{ host_genome_id: 1 }];
      return (
        <HostOrganismMessage hostGenomes={hostGenomes} samples={samples} />
      );
    }

    if (currentTab === TABS[1]) {
      return (
        <GeoSearchInputBox
          className={cs.geoSearchBox}
          // Calls save on selection
          onResultSelect={this.handleResultSelected}
        />
      );
    }
  };

  render() {
    return (
      <NarrowContainer>
        <Tabs
          className={cs.tabs}
          tabs={TABS}
          value={this.state.currentTab}
          onChange={this.onTabChange}
        />
        <div className={cs.componentContainer}>
          <div className={cs.componentFrame}>{this.renderComponent()}</div>
        </div>
      </NarrowContainer>
    );
  }
}
