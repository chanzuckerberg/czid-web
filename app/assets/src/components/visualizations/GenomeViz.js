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
    if (this.sortedEndpoints.length == 0 || !this.endpointToDataIndex) {
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
          ? this.endpointToDataIndex[closestEndpoints[0]][0]
          : null;
    } else {
      const [dataIndexOne, otherEndpointOne] = this.endpointToDataIndex[
        closestEndpoints[0]
      ];
      const [dataIndexTwo, otherEndpointTwo] = this.endpointToDataIndex[
        closestEndpoints[1]
      ];

      // Check if the mouse is currently within either bar corresponding to the closest endpoints.
      // This assumes that whenever the mouse is within a bar, one of the two closest endpoints will
      // belong to the bar, which is not always true if there is one bar completely covered by another.
      // For now, we assume this is never the case.
      if (closestEndpoints[0] <= hoverX && hoverX <= otherEndpointOne) {
        closestDataIndex = dataIndexOne;
      } else if (otherEndpointTwo <= hoverX && hoverX <= closestEndpoints[1]) {
        closestDataIndex = dataIndexTwo;
      } else {
        const closestX =
          Math.abs(closestEndpoints[0] - hoverX) <
          Math.abs(closestEndpoints[1] - hoverX)
            ? closestEndpoints[0]
            : closestEndpoints[1];

        closestDataIndex =
          Math.abs(closestX - hoverX) < this.options.hoverBuffer
            ? this.endpointToDataIndex[closestX][0]
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
      this.lastHoveredDataIndex !== null &&
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
      // Include the data index, and also the other endpoint.
      endpointToDataIndex[x(datum[0])] = [dataIndex, x(datum[1])];
      endpoints.push(x(datum[0]));
      endpointToDataIndex[x(datum[1])] = [dataIndex, x(datum[0])];
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
