import React from "react";

import NarrowContainer from "~/components/layout/NarrowContainer";
import Tabs from "~/components/ui/controls/Tabs";
import HostOrganismMessage from "~/components/views/SampleUploadFlow/HostOrganismMessage";
import GeoSearchInputBox from "~ui/controls/GeoSearchInputBox";

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
          samples={[{ host_genome_id: 1, host_genome_name: "human" }]}
        />,
        // multiple same match
        <HostOrganismMessage
          key="6"
          hostGenomes={[{ name: "Human", id: 1 }]}
          samples={[
            { host_genome_id: 1, host_genome_name: "Human" },
            { host_genome_id: 1, host_genome_name: "Human" },
          ]}
        />,
        // one non-human match
        <HostOrganismMessage
          key="5"
          hostGenomes={[{ name: "Bat", id: 4 }]}
          samples={[{ host_genome_id: 4, host_genome_name: "Bat" }]}
        />,
        // one no match
        <HostOrganismMessage
          key="2"
          hostGenomes={[{ name: "Human", id: 1 }]}
          samples={[{ host_genome_id: 2, host_genome_name: "none" }]}
        />,
        // one no match ERCC only
        <HostOrganismMessage
          key="7"
          hostGenomes={[{ name: "Ferret", id: 1, ercc_only: true }]}
          samples={[{ host_genome_id: 1, host_genome_name: "Ferret" }]}
        />,
        // ERCC only
        <HostOrganismMessage
          key="3"
          hostGenomes={[{ name: "ERCC Only", id: 7, ercc_only: true }]}
          samples={[{ host_genome_id: 7, host_genome_name: "ERCC Only" }]}
        />,
        // many
        <HostOrganismMessage
          key="4"
          hostGenomes={[
            { name: "Human", id: 1 },
            { name: "Mosquito", id: 2 },
          ]}
          samples={[
            { host_genome_id: 1, host_genome_name: "Human" },
            { host_genome_id: 2, host_genome_name: "none" },
            { host_genome_id: 3, host_genome_name: "none" },
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
