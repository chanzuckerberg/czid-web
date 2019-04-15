import { select, event as currentEvent, mouse } from "d3-selection";
import { extent, min, max } from "d3-array";
import { flatten } from "lodash/fp";
import { scaleLinear } from "d3-scale";

import ArrayUtils from "~/components/utils/ArrayUtils";
import { CategoricalColormap } from "../utils/colormaps/CategoricalColormap";

export default class GenomeViz {
  constructor(container, data, options) {
    this.g = null;
    this.container = select(container);
    // Data is of the form [xStart, xEnd, colorIndex]
    this.data = data;

    this.margins = options.margins || {
      top: 0,
      right: 0,
      bottom: 0,
      left: 0
    };

    this.size = {
      width: container.clientWidth || 800,
      height: container.clientHeight || 400
    };

    this.options = Object.assign(
      {
        colors: null,
        hoverBuffer: 5
      },
      options
    );

    this.lastHoveredDataIndex = null;

    // remove any previous charts
    this.container.selectAll("svg").remove();

    this.svg = this.container
      .append("svg")
      .attr("width", this.size.width)
      .attr("height", this.size.height);
    this.svg.remove;
  }

  getColors = () => {
    if (this.options.colors) {
      return this.options.colors;
    }

    return new CategoricalColormap().getNScale(this.data.length + 1);
  };

  getDomain = () => {
    if (this.options.domain) {
      return this.options.domain;
    }

    let mins = [];
    let maxs = [];
    for (let i = 0; i < this.data.length; i++) {
      let series = flatten(this.data[i]);
      let minMax = extent(series);
      mins.push(minMax[0]);
      maxs.push(minMax[1]);
    }
    return [min(mins), max(maxs)];
  };

  // Find the bar that is closest to hoverX, within hoverBuffer.
  onMouseMove = () => {
    if (this.sortedEndpoints.length == 0) {
      return;
    }

    const hoverX = mouse(this.svg.node())[0];
    const closestEndpoints = ArrayUtils.findClosestNeighbors(
      this.sortedEndpoints,
      hoverX
    );

    let closestDataIndex = null;

    if (closestEndpoints.length === 1) {
      closestDataIndex =
        Math.abs(closestEndpoints[0] - hoverX) < this.options.hoverBuffer
          ? this.endpointToDataIndex[closestEndpoints[0]]
          : null;
    } else {
      const barOne = this.endpointToDataIndex[closestEndpoints[0]];
      const barTwo = this.endpointToDataIndex[closestEndpoints[1]];

      // Assuming that the bars don't overlap,
      // if the two neighbors correspond to the same bar, then the mouse must currently be within the bar.
      if (barOne === barTwo) {
        closestDataIndex = barOne;
      } else {
        const closestX =
          Math.abs(closestEndpoints[0] - hoverX) <
          Math.abs(closestEndpoints[1] - hoverX)
            ? closestEndpoints[0]
            : closestEndpoints[1];

        closestDataIndex =
          Math.abs(closestX - hoverX) < this.options.hoverBuffer
            ? this.endpointToDataIndex[closestX]
            : null;
      }
    }

    if (this.options.onGenomeVizHover) {
      this.options.onGenomeVizHover(
        currentEvent.pageX,
        currentEvent.pageY,
        closestDataIndex
      );
    }

    if (
      this.lastHoveredDataIndex !== closestDataIndex &&
      closestDataIndex !== null &&
      this.options.onGenomeVizBarEnter
    ) {
      this.options.onGenomeVizBarEnter(closestDataIndex);
      this.lastHoveredDataIndex = closestDataIndex;
    } else if (
      closestDataIndex === null &&
      this.lastHoveredDataIndex &&
      this.options.onGenomeVizBarExit
    ) {
      this.options.onGenomeVizBarExit();
      this.lastHoveredDataIndex = null;
    }

    if (closestDataIndex !== null && this.options.onGenomeVizBarHover) {
      this.options.onGenomeVizBarHover(currentEvent.pageX, currentEvent.pageY);
    }
  };

  onMouseLeave = () => {
    if (this.options.onGenomeVizBarExit) {
      this.options.onGenomeVizBarExit();
      this.lastHoveredDataIndex = null;
    }
  };

  update() {
    if (!this.data) return;

    let colors = this.getColors();
    const domain = this.getDomain();

    let x = scaleLinear()
      .domain(domain)
      .nice()
      .range([this.margins.left, this.size.width - this.margins.right]);

    const endpointToDataIndex = {};
    const endpoints = [];

    this.svg
      .append("g")
      .selectAll("rect")
      .data(this.data)
      .enter()
      .append("rect")
      .attr("fill", d => colors[d[2]])
      .attr("x", d => x(d[0]))
      .attr("width", d => x(d[1]) - x(d[0]))
      .attr("y", () => 0)
      .attr("height", () => this.size.height);

    this.data.forEach((datum, dataIndex) => {
      endpointToDataIndex[x(datum[0])] = dataIndex;
      endpoints.push(x(datum[0]));
      endpointToDataIndex[x(datum[1])] = dataIndex;
      endpoints.push(x(datum[1]));
    });

    this.endpointToDataIndex = endpointToDataIndex;
    this.sortedEndpoints = endpoints.sort((a, b) => a - b);

    this.svg
      .append("rect")
      .attr("style", "fill: transparent")
      .attr("transform", `translate(${this.margins.left}, ${this.margins.top})`)
      .attr("width", this.size.width - this.margins.right - this.margins.left)
      .attr("height", this.size.height - this.margins.top - this.margins.bottom)
      .on("mousemove", this.onMouseMove)
      .on("mouseleave", this.onMouseLeave);
  }
}
