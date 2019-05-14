import React from "react";

import NarrowContainer from "~/components/layout/NarrowContainer";
import Tabs from "~/components/ui/controls/Tabs";
import Heatmap from "~/components/visualizations/heatmap/Heatmap";

import cs from "./playground_viz.scss";

const TABS = ["Heatmap"];

export default class PlaygroundViz extends React.Component {
  state = {
    currentTab: TABS[0]
  };

  componentDidMount() {
    this.renderViz();
  }

  componentDidUpdate(prevProps, prevState) {
    if (prevState.currentTab !== this.state.currentTab) {
      this.renderViz();
    }
  }

  onTabChange = tab => {
    this.setState({ currentTab: tab });
  };

  renderViz = () => {
    const { currentTab } = this.state;
    if (currentTab === "Heatmap") {
      this.viz = new Heatmap(
        this.vizContainer,
        // Data for the heatmap.
        {
          rowLabels: [
            { label: "Row 1" },
            { label: "Row 2" },
            { label: "Row 3" }
          ],
          columnLabels: [
            { label: "Column 1" },
            { label: "Column 2" },
            { label: "Column 3" },
            { label: "Column 4" },
            { label: "Column 5" }
          ],
          values: [[0, 1, 2, 3, 4], [1, 2, 3, 4, 5], [2, 3, 4, 5, 6]]
        },
        // Custom options.
        {
          marginLeft: 0,
          marginRight: 0
        }
      );

      this.viz.start();
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
        <div
          className={cs.vizContainer}
          ref={container => {
            this.vizContainer = container;
          }}
        />
      </NarrowContainer>
    );
  }
}
