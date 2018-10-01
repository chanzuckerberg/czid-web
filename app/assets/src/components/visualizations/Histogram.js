import { histogram, extent, max } from "d3-array";
import { axisBottom, axisLeft } from "d3-axis";
import { select } from "d3-selection";
import { scaleLinear } from "d3-scale";

export default class Histogram {
  constructor(container, data, options) {
    this.g = null;
    this.container = select(container);
    this.data = data;

    this.margins = {
      top: 20,
      right: 20,
      bottom: 30,
      left: 40
    };

    this.size = {
      width: 800,
      height: 400
    };

    this.options = Object.assign(
      {
        labelX: "reads",
        labelY: "count"
      },
      options
    );

    this.svg = this.container
      .append("svg")
      .attr("preserveAspectRatio", "xMinYMin meet")
      .attr("viewBox", `0 0 ${this.size.width} ${this.size.height}`);
  }

  xAxis(g, x) {
    g
      .attr(
        "transform",
        `translate(0,${this.size.height - this.margins.bottom})`
      )
      .call(axisBottom(x).tickSizeOuter(0));
    g
      .append("text")
      .attr("x", this.size.width - this.margins.right)
      .attr("y", -4)
      .attr("fill", "#000")
      .attr("font-weight", "bold")
      .attr("text-anchor", "end")
      .text(this.labelX);
  }

  yAxis(g, y) {
    g.attr("transform", `translate(${this.margins.left},0)`).call(axisLeft(y));

    g.select(".domain").remove();
    g
      .select(".tick:last-of-type text")
      .clone()
      .attr("x", 4)
      .attr("text-anchor", "start")
      .attr("font-weight", "bold")
      .text(this.labelY);
  }

  update() {
    let x = scaleLinear()
      .domain(extent(this.data))
      .nice()
      .range([0, this.size.width]);
    console.log(x);

    let bins = histogram()
      .domain(x.domain())
      .thresholds(x.ticks(20))(this.data);

    console.log(bins);

    let y = scaleLinear()
      .domain([0, max(bins, d => d.length)])
      .nice()
      .range([this.size.height, 0]);

    this.svg
      .append("g")
      .attr("fill", "steelblue")
      .selectAll("rect")
      .data(bins)
      .enter()
      .append("rect")
      .attr("x", d => x(d.x0) + 1)
      .attr("width", d => Math.max(0, x(d.x1) - x(d.x0) - 1))
      .attr("y", d => y(d.length))
      .attr("height", d => y(0) - y(d.length));

    this.svg.append("g").call(this.xAxis.bind(this), x);

    this.svg.append("g").call(this.yAxis.bind(this), y);
  }
}
