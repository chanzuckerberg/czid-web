import { scaleLinear, scaleSequential } from "d3-scale";
import { interpolateYlOrRd } from "d3-scale-chromatic";
import { select } from "d3-selection";
import numberAbbreviate from "number-abbreviate";
import textWidth from "text-width";

export default class HeatmapLegend {
  constructor(container, options) {
    this.svg = null;
    this.g = null;
    this.container = select(container);

    this.options = Object.assign(
      {
        numberOfLevels: 10,
        scale: scaleLinear,
        colors: null,
        height: 35,
        width: container.clientWidth,
        min: 0,
        max: 10,
        levels: 10,
        cellHeight: 20,
        cellWidth: null,
        fontSize: "9pt"
      },
      options
    );

    if (!this.options.colors) {
      let defaultColorScale = scaleSequential(interpolateYlOrRd);
      this.options.colors = this.range(this.options.numberOfLevels).map(i =>
        defaultColorScale(i / (this.options.numberOfLevels - 1))
      );
    }

    this.setup();
  }

  range(n) {
    return Array.apply(null, { length: n }).map(Number.call, Number);
  }

  setup() {
    this.svg = this.container
      .append("svg")
      .attr("class", "legend")
      .attr("width", this.options.width)
      .attr("height", this.options.height);

    this.g = this.svg.append("g");
    this.gCells = this.g.append("g");
    this.gLabels = this.g.append("g");
  }

  update() {
    let minLabel = numberAbbreviate(Math.round(this.options.min));
    let maxLabel = numberAbbreviate(Math.round(this.options.max));
    let minLabelSize = textWidth(minLabel, this.options.fontSize);
    let maxLabelSize = textWidth(maxLabel, this.options.fontSize);
    let cellsWidth = this.options.width - minLabelSize / 2 - maxLabelSize / 2;
    let cellWidth = cellsWidth / this.options.colors.length;

    this.gLabels
      .selectAll(".legend-text-min")
      .data([this.min])
      .enter()
      .append("text")
      .attr("class", "mono")
      .text(minLabel)
      .attr("x", minLabelSize / 2)
      .attr("y", this.options.height)
      .attr("text-anchor", "middle");

    this.gLabels
      .selectAll(".legend-text-max")
      .data([this.options.max])
      .enter()
      .append("text")
      .attr("class", "mono")
      .text(maxLabel)
      .attr("x", minLabelSize / 2 + cellsWidth)
      .attr("y", this.options.height)
      .style("text-anchor", "middle");

    this.gCells
      .selectAll(".legend-cell")
      .data(this.options.colors)
      .enter()
      .append("rect")
      .attr("x", (_, i) => minLabelSize / 2 + Math.floor(cellWidth * i))
      .attr("y", 0)
      .attr("width", Math.ceil(cellWidth))
      .attr("height", this.options.cellHeight)
      .style("fill", d => d);
  }
}
