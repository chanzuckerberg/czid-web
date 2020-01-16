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
      return [
        // one match
        <HostOrganismMessage
          key="1"
          hostGenomes={[{ name: "Human", id: 1 }]}
          samples={[{ host_genome_id: 1 }]}
        />,
        // one no match
        <HostOrganismMessage
          key="2"
          hostGenomes={[{ name: "Human", id: 1 }]}
          samples={[{ host_genome_id: 2 }]}
        />,
        // ERCC only
        <HostOrganismMessage
          key="3"
          hostGenomes={[{ name: "ERCC Only", id: 7 }]}
          samples={[{ host_genome_id: 7 }]}
        />,
        // many
        <HostOrganismMessage
          key="4"
          hostGenomes={[{ name: "Human", id: 1 }, { name: "Mosquito", id: 2 }]}
          samples={[
            { host_genome_id: 1 },
            { host_genome_id: 2 },
            { host_genome_id: 3 },
          ]}
        />,
      ];
    }

    if (currentTab === TABS[1]) {
      return (
        <div className={cs.componentFrame}>
          <GeoSearchInputBox
            className={cs.geoSearchBox}
            // Calls save on selection
            onResultSelect={this.handleResultSelected}
          />
        </div>
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
        <div className={cs.componentContainer}>{this.renderComponent()}</div>
      </NarrowContainer>
    );
  }
}
