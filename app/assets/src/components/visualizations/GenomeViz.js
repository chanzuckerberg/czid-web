import { select } from "d3-selection";
import { extent, min, max } from "d3-array";
import { flatten } from "lodash/fp";
import { scaleLinear } from "d3-scale";

import { CategoricalColormap } from "../utils/colormaps/CategoricalColormap";

export default class GenomeViz {
  constructor(container, data, options) {
    this.g = null;
    this.container = select(container);
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
        colors: null
      },
      options
    );

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

  update() {
    if (!this.data) return;

    let colors = this.getColors();
    const domain = this.getDomain();

    let x = scaleLinear()
      .domain(domain)
      .nice()
      .range([this.margins.left, this.size.width - this.margins.right]);

    this.data.forEach((data, index) => {
      this.svg
        .append("g")
        .attr("class", `series-${index}`)
        .attr("fill", colors[index])
        .selectAll("rect")
        .data(data)
        .enter()
        .append("rect")
        .attr("x", d => x(d[0]))
        .attr("width", d => x(d[1]) - x(d[0]))
        .attr("y", () => 0)
        .attr("height", () => this.size.height);
    });
  }
}
