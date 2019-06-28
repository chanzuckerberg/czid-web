import React from "react";

import NarrowContainer from "~/components/layout/NarrowContainer";
import Tabs from "~/components/ui/controls/Tabs";
import GeoSearchInputBox from "~ui/controls/GeoSearchInputBox";

import cs from "./playground_components.scss";

const TABS = ["Geo Search Box"];

export default class PlaygroundComponents extends React.Component {
  state = {
    currentTab: TABS[0],
  };

  onTabChange = tab => {
    this.setState({ subject: tab });
  };

  handleResultSelected = ({ result }) => {
    // eslint-disable-next-line no-console
    console.log("PlaygroundComponents:handleResultSelected", result);
  };

  renderComponent = () => {
    const { currentTab } = this.state;
    if (currentTab === "Geo Search Box") {
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
