import { extent, min, max } from "d3-array";
import { color } from "d3-color";
import { scaleLinear } from "d3-scale";
import { select, event as currentEvent, mouse } from "d3-selection";
import { flatten } from "lodash/fp";

const DEFAULT_COLOR = "#3867FA";

export default class GenomeViz {
  barEndpoints: $TSFixMe;
  container: $TSFixMe;
  data: $TSFixMe;
  g: $TSFixMe;
  lastHoveredDataIndex: $TSFixMe;
  margins: $TSFixMe;
  options: $TSFixMe;
  size: $TSFixMe;
  svg: $TSFixMe;
  x: $TSFixMe;
  constructor(container: $TSFixMe, data: $TSFixMe, options: $TSFixMe) {
    this.g = null;
    this.container = select(container);
    // Data is of the form [xStart, xEnd]
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
        color: DEFAULT_COLOR,
        hoverBuffer: 5,
        hoverDarkenFactor: 0.25,
      },
      options,
    );

    this.lastHoveredDataIndex = null;
    this.barEndpoints = null;

    // remove any previous charts
    this.container.selectAll("svg").remove();

    this.svg = this.container
      .append("svg")
      .attr("width", this.size.width)
      .attr("height", this.size.height);
  }

  getDomain = () => {
    if (this.options.domain) {
      return this.options.domain;
    }

    const mins = [];
    const maxs = [];
    for (let i = 0; i < this.data.length; i++) {
      const series = flatten(this.data[i]);
      const minMax = extent(series);
      mins.push(minMax[0]);
      maxs.push(minMax[1]);
    }
    return [min(mins), max(maxs)];
  };

  // Get the smallest bar that overlaps svgX. If none exist, get the closest one within hoverBuffer.
  // svgX is an x coordinate relative to the svg container.
  // All the bar "endpoints" are within this same coordinate space.
  getDataIndexForSvgX = (svgX: $TSFixMe) => {
    // The smallest bar that overlaps svgX.
    let smallestBarIndex: $TSFixMe = null;
    let smallestBarSize: $TSFixMe = null;
    // The closest bar within hoverBuffer of svgX.
    let closestBufferBarIndex: $TSFixMe = null;
    let closestBufferBarDistance: $TSFixMe = null;

    this.barEndpoints.forEach(([start, end, dataIndex]) => {
      if (
        start <= svgX &&
        svgX <= end &&
        (smallestBarIndex === null || end - start < smallestBarSize)
      ) {
        smallestBarIndex = dataIndex;
        smallestBarSize = end - start;
      }

      if (
        smallestBarIndex === null &&
        start - this.options.hoverBuffer <= svgX &&
        svgX <= end + this.options.hoverBuffer
      ) {
        const distance = Math.min(Math.abs(start - svgX), Math.abs(svgX - end));

        if (
          closestBufferBarIndex === null ||
          distance < closestBufferBarDistance
        ) {
          closestBufferBarDistance = distance;
          closestBufferBarIndex = dataIndex;
        }
      }
    });

    return smallestBarIndex !== null ? smallestBarIndex : closestBufferBarIndex;
  };

  onMouseMove = () => {
    if (!this.barEndpoints || this.barEndpoints.length === 0) {
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
        currentEvent.clientY,
      );
    }
  };

  onMouseClick = () => {
    if (!this.barEndpoints || this.barEndpoints.length === 0) {
      return;
    }

    const svgX = mouse(this.svg.node())[0];
    const closestDataIndex = this.getDataIndexForSvgX(svgX);

    if (this.options.onGenomeVizBarClick) {
      if (closestDataIndex !== null) {
        const barBBox = this.svg
          .select(".bar-container")
          .selectAll("rect")
          .filter((_d: $TSFixMe, i: $TSFixMe) => i === closestDataIndex)
          .node()
          .getBoundingClientRect();
        this.options.onGenomeVizBarClick(
          closestDataIndex,
          barBBox.right,
          barBBox.top,
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

  // Re-draw the highlighted bar above all other bars, to ensure that it shows up at the top.
  highlightBar = (barIndex: $TSFixMe, shouldHighlight: $TSFixMe) => {
    // Remove all previous highlight bars.
    this.svg.selectAll(".highlight-container rect").remove();

    if (shouldHighlight) {
      if (barIndex === null) {
        return;
      }
      const d = this.data[barIndex];
      const highlightColor = color(this.options.color).darker(
        this.options.hoverDarkenFactor,
      );

      this.svg
        .select(".highlight-container")
        .append("rect")
        .attr("fill", highlightColor)
        .attr("x", this.x(d[0]))
        .attr("width", this.x(d[1]) - this.x(d[0]))
        .attr("y", 0)
        .attr("height", this.size.height);
    }
  };

  // We require a separate rectangle to show the black border when a bar is clicked because we need
  // to shrink the rectangle by outlineBuffer.
  // Otherwise, the top and bottom border will overflow out of the parent <svg> (and be partially hidden),
  // but the left and right will not, which results in an uneven border around the bar.
  outlineBar = (barIndex: $TSFixMe, shouldHighlight: $TSFixMe) => {
    // Remove all previous outline bars.
    this.svg.selectAll(".outline-container rect").remove();

    if (shouldHighlight) {
      if (barIndex === null) {
        return;
      }
      const d = this.data[barIndex];

      // Shrink the rectangle by outlineBuffer so the border isn't partially cut off.
      const outlineBuffer = 1;

      this.svg
        .select(".outline-container")
        .append("rect")
        .attr("fill", this.options.color)
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

    const domain = this.getDomain();

    const x = scaleLinear()
      .domain(domain)
      .nice()
      .range([this.margins.left, this.size.width - this.margins.right]);

    this.x = x;

    const barEndpoints: $TSFixMe = [];

    this.svg
      .append("g")
      .attr("class", "bar-container")
      .selectAll("rect")
      .data(this.data)
      .enter()
      .append("rect")
      .attr("fill", this.options.color)
      .attr("x", (d: $TSFixMe) => x(d[0]))
      .attr("width", (d: $TSFixMe) => x(d[1]) - x(d[0]))
      .attr("y", () => 0)
      .attr("height", () => this.size.height);

    this.data.forEach((datum: $TSFixMe, dataIndex: $TSFixMe) => {
      barEndpoints.push([x(datum[0]), x(datum[1]), dataIndex]);
    });

    this.barEndpoints = barEndpoints;

    this.svg.append("g").attr("class", "highlight-container");
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
