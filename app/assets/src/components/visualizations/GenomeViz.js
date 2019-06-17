import { select, event as currentEvent, mouse } from "d3-selection";
import { extent, min, max } from "d3-array";
import { flatten } from "lodash/fp";
import { scaleLinear } from "d3-scale";
import { color } from "d3-color";

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
      left: 0,
    };

    this.size = {
      width: container.clientWidth || 800,
      height: container.clientHeight || 400,
    };

    this.options = Object.assign(
      {
        colors: null,
        hoverBuffer: 5,
        hoverDarkenFactor: 0.25,
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

  // Find the bar that is closest to svgX, within hoverBuffer.
  // svgX is an x coordinate relative to the svg container.
  // All the bar "endpoints" are within this same coordinate space.
  getDataIndexForSvgX = svgX => {
    const closestEndpoints = ArrayUtils.findClosestNeighbors(
      this.sortedEndpoints,
      svgX
    );

    let closestDataIndex = null;

    if (closestEndpoints.length === 1) {
      closestDataIndex =
        Math.abs(closestEndpoints[0] - svgX) < this.options.hoverBuffer
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
      if (closestEndpoints[0] <= svgX && svgX <= otherEndpointOne) {
        closestDataIndex = dataIndexOne;
      } else if (otherEndpointTwo <= svgX && svgX <= closestEndpoints[1]) {
        closestDataIndex = dataIndexTwo;
      } else {
        const closestX =
          Math.abs(closestEndpoints[0] - svgX) <
          Math.abs(closestEndpoints[1] - svgX)
            ? closestEndpoints[0]
            : closestEndpoints[1];

        closestDataIndex =
          Math.abs(closestX - svgX) < this.options.hoverBuffer
            ? this.endpointToDataIndex[closestX][0]
            : null;
      }
    }

    return closestDataIndex;
  };

  onMouseMove = () => {
    if (this.sortedEndpoints.length == 0 || !this.endpointToDataIndex) {
      return;
    }

    const svgX = mouse(this.svg.node())[0];
    const closestDataIndex = this.getDataIndexForSvgX(svgX);

    if (
      this.lastHoveredDataIndex !== closestDataIndex &&
      closestDataIndex !== null
    ) {
      if (this.options.onGenomeVizBarEnter) {
        this.options.onGenomeVizBarEnter(closestDataIndex);
      }
      this.highlightBar(closestDataIndex, true);
      this.highlightBar(this.lastHoveredDataIndex, false);
      this.lastHoveredDataIndex = closestDataIndex;
    } else if (
      closestDataIndex === null &&
      this.lastHoveredDataIndex !== null &&
      this.options.onGenomeVizBarExit
    ) {
      if (this.options.onGenomeVizBarExit) {
        this.options.onGenomeVizBarExit();
      }
      this.highlightBar(this.lastHoveredDataIndex, false);
      this.lastHoveredDataIndex = null;
    }
    if (closestDataIndex !== null && this.options.onGenomeVizBarHover) {
      this.options.onGenomeVizBarHover(
        currentEvent.clientX,
        currentEvent.clientY
      );
    }
  };

  onMouseClick = () => {
    if (this.sortedEndpoints.length == 0 || !this.endpointToDataIndex) {
      return;
    }

    const svgX = mouse(this.svg.node())[0];
    const closestDataIndex = this.getDataIndexForSvgX(svgX);

    if (this.options.onGenomeVizBarClick) {
      if (closestDataIndex !== null) {
        const barBBox = this.svg
          .select(`.bar-container .rect-${closestDataIndex}`)
          .node()
          .getBoundingClientRect();
        this.options.onGenomeVizBarClick(
          closestDataIndex,
          barBBox.right,
          barBBox.top
        );
        this.outlineBar(closestDataIndex, true);
      } else {
        this.options.onGenomeVizBarClick(null);
        // Hide the outline around the bar.
        this.outlineBar(null, false);
      }
    }
  };

  onMouseLeave = () => {
    if (this.options.onGenomeVizBarExit) {
      this.options.onGenomeVizBarExit();
    }
    this.highlightBar(this.lastHoveredDataIndex, false);
    this.lastHoveredDataIndex = null;
  };

  highlightBar = (barIndex, shouldHighlight) => {
    if (barIndex === null) {
      return;
    }
    const colors = this.getColors();

    let highlightColor = colors[this.data[barIndex][2]];

    if (shouldHighlight) {
      highlightColor = color(highlightColor).darker(
        this.options.hoverDarkenFactor
      );
    }

    this.svg
      .select(`.bar-container .rect-${barIndex}`)
      .attr("fill", highlightColor);
  };

  // We require a separate rectangle to show the black border when a bar is clicked because we need
  // to shrink the rectangle by outlineBuffer.
  // Otherwise, the top and bottom border will overflow out of the parent <svg> (and be partially hidden),
  // but the left and right will not, which results in an uneven border around the bar.
  outlineBar = (barIndex, shouldHighlight) => {
    // Remove all previous outline bars.
    this.svg.selectAll(".outline-container rect").remove();

    if (shouldHighlight) {
      if (barIndex === null) {
        return;
      }
      const d = this.data[barIndex];
      let colors = this.getColors();

      // Shrink the rectangle by outlineBuffer so the border isn't partially cut off.
      const outlineBuffer = 1;

      this.svg
        .select(".outline-container")
        .append("rect")
        .attr("fill", colors[d[2]])
        .attr("x", this.x(d[0]) + outlineBuffer)
        .attr("width", this.x(d[1]) - this.x(d[0]) - outlineBuffer * 2)
        .attr("y", outlineBuffer)
        .attr("height", this.size.height - outlineBuffer * 2)
        .attr("stroke", "#000")
        .attr("stroke-width", 2);
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

    this.x = x;

    const endpointToDataIndex = {};
    const endpoints = [];

    this.svg
      .append("g")
      .attr("class", "bar-container")
      .selectAll("rect")
      .data(this.data)
      .enter()
      .append("rect")
      .attr("class", (_, index) => `rect-${index}`)
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

    this.svg.append("g").attr("class", "outline-container");

    this.svg
      .append("rect")
      .attr("style", "fill: transparent")
      .attr("transform", `translate(${this.margins.left}, ${this.margins.top})`)
      .attr("width", this.size.width - this.margins.right - this.margins.left)
      .attr("height", this.size.height - this.margins.top - this.margins.bottom)
      .on("mousemove", this.onMouseMove)
      .on("click", this.onMouseClick)
      .on("mouseleave", this.onMouseLeave);
  }
}
