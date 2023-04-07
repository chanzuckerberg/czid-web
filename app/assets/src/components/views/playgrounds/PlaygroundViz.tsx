import React from "react";
import NarrowContainer from "~/components/layout/NarrowContainer";
import Tabs from "~/components/ui/controls/Tabs";
import HorizontalStackedBarChart from "~/components/visualizations/bar_charts/HorizontalStackedBarChart";
import Heatmap, {
  HeatmapData,
} from "~/components/visualizations/heatmap/Heatmap";
import { STACKED_DATA_CSV } from "./constants";
import cs from "./playground_viz.scss";

const TABS = ["Heatmap", "HorizontalStackedBarChart"];

export default class PlaygroundViz extends React.Component {
  vizContainer: HTMLDivElement;
  viz: Heatmap;
  state = {
    currentTab: TABS[0],
  };

  componentDidMount() {
    this.renderViz();
  }

  onTabChange = tab => {
    this.setState({ currentTab: tab });
  };

  parseCSV = csv => {
    const rows = csv.split("\n");
    const keys = rows.shift().split(",");

    const data = rows.map(row => {
      const values = row.split(",");
      const rowData = {};
      let total = 0;
      values.forEach((value, index) => {
        const key = keys[index];
        let entry = value;
        if (index !== 0) {
          entry = +value;
          total += entry;
        }
        rowData[key] = entry;
      });
      rowData["total"] = total;
      return rowData;
    });

    return { keys, data };
  };

  renderHeatmap() {
    const heatmapAnchor = (
      <div
        className={cs.heatmapContainer}
        ref={container => {
          this.vizContainer = container;
        }}
      />
    );
    this.viz = new Heatmap(
      this.vizContainer,
      // Data for the heatmap.
      {
        rowLabels: [{ label: "Row 1" }, { label: "Row 2" }, { label: "Row 3" }],
        columnLabels: [
          { label: "Column 1" },
          { label: "Column 2" },
          { label: "Column 3" },
          { label: "Column 4" },
          { label: "Column 5" },
        ],
        values: [
          [0, 1, 2, 3, 4],
          [1, 2, 3, 4, 5],
          [2, 3, 4, 5, 6],
        ],
      } as HeatmapData,
      // Custom options.
      {
        marginLeft: 0,
        marginRight: 0,
      },
    );

    this.viz.start();
    return <div className={cs.vizContainer}>{heatmapAnchor}</div>;
  }

  renderHorizontalStackedBarChart() {
    const { keys, data } = this.parseCSV(STACKED_DATA_CSV);

    const sort = (a, b) => {
      return b.total - a.total;
    };

    const options = {
      canvasClassName: cs.canvas,
      sort: sort,
      x: {
        pathVisible: true,
        ticksVisible: true,
        axisTitle: "Population",
      },
      y: {
        pathVisible: true,
        ticksVisible: true,
      },
    };

    const events = {
      // eslint-disable-next-line no-console
      onYAxisLabelClick: console.log,
      // eslint-disable-next-line no-console
      onBarStackHover: console.log,
      // eslint-disable-next-line no-console
      onBarEmptySpaceHover: console.log,
    };

    const width = 960;

    return (
      <div className={cs.barChartContainer}>
        <HorizontalStackedBarChart
          data={data}
          keys={keys}
          // @ts-expect-error Property 'width' does not exist on type
          width={width}
          options={options}
          events={events}
          yAxisKey={keys[0]}
          className={cs.chart}
        />
      </div>
    );
  }

  renderViz() {
    const { currentTab } = this.state;

    switch (currentTab) {
      case "Heatmap":
        return this.renderHeatmap();
      case "HorizontalStackedBarChart":
        return this.renderHorizontalStackedBarChart();
    }
  }

  render() {
    return (
      <NarrowContainer>
        <Tabs
          className={cs.tabs}
          tabs={TABS}
          value={this.state.currentTab}
          onChange={this.onTabChange}
        />
        {this.renderViz()}
      </NarrowContainer>
    );
  }
}
