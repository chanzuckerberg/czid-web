import { histogram, extent, min, max, mean, deviation } from "d3-array";
import { axisBottom, axisLeft } from "d3-axis";
import { select } from "d3-selection";
import { scaleLinear } from "d3-scale";
import { CategoricalColormap } from "../utils/colormaps/CategoricalColormap";

export default class Histogram {
  constructor(container, data, options) {
    this.g = null;
    this.container = select(container);
    this.data = this.parseData(data);

    this.margins = {
      top: 20,
      right: 40,
      bottom: 40,
      left: 40
    };

    this.size = {
      width: container.clientWidth || 800,
      height: container.clientHeight || 400
    };

    this.options = Object.assign(
      {
        colormap: "viridis",
        labelX: "",
        labelY: "",
        seriesNames: null,
        showStatistics: true,
        refValues: []
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

  parseData(data) {
    // basic parsing to support multiple series
    // does not support all bad inputs
    if (!Array.isArray(data)) return null;

    if (!Array.isArray(data[0])) return [data];

    return data;
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
      .attr("y", +30)
      .attr("fill", "#000")
      .attr("font-weight", "bold")
      .attr("text-anchor", "end")
      .text(this.options.labelX);
  }

  yAxis(g, y) {
    g.attr("transform", `translate(${this.margins.left},0)`).call(axisLeft(y));

    g.select(".domain").remove();
    g
      .select(".tick:last-of-type text")
      .clone()
      .attr("x", 4)
      .attr("y", -30)
      .attr("transform", "rotate(-90)")
      .attr("text-anchor", "end")
      .attr("font-weight", "bold")
      .text(this.options.labelY);
  }

  update() {
    if (!this.data) return;

    let colors = new CategoricalColormap().getNScale(this.data.length + 1);

    let mins = [];
    let maxs = [];
    for (let i = 0; i < this.data.length; i++) {
      let series = this.data[i];
      let minMax = extent(series);
      mins.push(minMax[0]);
      maxs.push(minMax[1]);

      // make the chart is large enough to hold reference lines
      if (this.options.refValues && this.options.refValues.length) {
        let values = this.options.refValues.map(v => parseFloat(v.values[i]));
        mins.push(min(values));
        maxs.push(max(values));
      }
    }

    let x = scaleLinear()
      .domain([min(mins), max(maxs)])
      .nice()
      .range([this.margins.left, this.size.width - this.margins.right]);

    let bins = [];
    for (let i = 0; i < this.data.length; i++) {
      bins[i] = histogram()
        .domain(x.domain())
        .thresholds(x.ticks(20))(this.data[i]);
    }

    let y = scaleLinear()
      .domain([0, max(bins.map(seriesBins => max(seriesBins, d => d.length)))])
      .nice()
      .range([this.size.height - this.margins.bottom, this.margins.top]);

    let barWidth =
      (this.size.width - this.margins.right - this.margins.left) /
      (this.data.length * 20);
    for (let i = 0; i < bins.length; i++) {
      this.svg
        .append("g")
        .attr("class", `bar-${i}`)
        .attr("fill", colors[i])
        .selectAll("rect")
        .data(bins[i])
        .enter()
        .append("rect")
        .attr("x", d => x(d.x0) + i * barWidth)
        .attr("width", d => barWidth)
        .attr("y", d => y(d.length))
        .attr("height", d => y(0) - y(d.length))
        .style("opacity", 0.8);

      if (this.options.showStatistics) {
        let avg = mean(this.data[i]);
        let dev = deviation(this.data[i]);

        let stats = this.svg.append("g");

        stats
          .append("line")
          .attr("stroke", colors[i])
          .attr("x1", x(avg))
          .attr("x2", x(avg))
          .attr("y1", this.margins.top)
          .attr("y2", this.size.height - this.margins.bottom);

        let rect0 = max([x(avg - dev), this.margins.left]);
        let rect1 = min([x(avg + dev), this.size.width - this.margins.right]);
        let rectWidth = rect1 - rect0;

        stats
          .append("rect")
          .attr("fill", colors[i])
          .attr("fill-opacity", 0.2)
          .attr("x", rect0)
          .attr("width", rectWidth)
          .attr("y", this.margins.top)
          .attr(
            "height",
            this.size.height - this.margins.top - this.margins.bottom
          )
          .lower();
      }

      if (this.options.refValues && this.options.refValues.length) {
        let refs = this.svg.append("g").attr("class", "refs");

        for (let ref of this.options.refValues) {
          refs
            .append("line")
            .attr("stroke", colors[i])
            .style("stroke-dasharray", "4, 4")
            .attr("x1", x(ref.values[i]))
            .attr("x2", x(ref.values[i]))
            .attr("y1", this.margins.top)
            .attr("y2", this.size.height - this.margins.bottom);
          refs
            .append("text")
            .attr("x", -this.margins.top)
            .attr("y", x(ref.values[i]) - 4)
            .attr("transform", "rotate(-90)")
            .attr("text-anchor", "end")
            .attr("font-weight", "bold")
            .attr("font-size", 10)
            .style("fill", colors[i])
            .text(ref.name);
        }
      }
    }
    this.svg.append("g").call(this.xAxis.bind(this), x);

    this.svg.append("g").call(this.yAxis.bind(this), y);

    if (this.options.seriesNames) {
      let legend = this.svg
        .append("g")
        .attr("class", "histogram__legend")
        .attr("font-family", "sans-serif")
        .attr("font-size", 10)
        .attr("text-anchor", "end")
        .attr("text-anchor", "end")
        .selectAll("g")
        .data(this.options.seriesNames)
        .enter()
        .append("g")
        .attr("transform", (_, i) => `translate(-20,${(i + 1) * 20})`);

      legend
        .append("rect")
        .attr("x", this.size.width - 5)
        .attr("width", 20)
        .attr("height", 20)
        .attr("fill", (_, i) => colors[i]);

      legend
        .append("text")
        .attr("x", this.size.width - 10)
        .attr("y", this.margins.top)
        .attr("dy", -9)
        .attr("alignment-baseline", "middle")
        .text(d => d);
    }
  }
}
