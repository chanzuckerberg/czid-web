import { scaleSequential } from "d3-scale";
import { interpolateYlOrRd } from "d3-scale-chromatic";
import { select } from "d3-selection";
import numberAbbreviate from "number-abbreviate";
import textWidth from "text-width";

export default class HeatmapLegend {
  container: $TSFixMe;
  g: $TSFixMe;
  gCells: $TSFixMe;
  gLabels: $TSFixMe;
  options: $TSFixMe;
  svg: $TSFixMe;
  constructor(container: $TSFixMe, options: $TSFixMe) {
    this.svg = null;
    this.g = null;
    this.container = select(container);

    this.options = Object.assign(
      {
        numberOfLevels: 10,
        colors: null,
        height: 35,
        width: container.clientWidth,
        min: 0,
        max: 10,
        levels: 10,
        cellHeight: 20,
        cellWidth: null,
        fontSize: "9pt",
      },
      options,
    );

    if (!this.options.colors) {
      const defaultColorScale = scaleSequential(interpolateYlOrRd);
      this.options.colors = this.range(this.options.numberOfLevels).map(i =>
        defaultColorScale(i / (this.options.numberOfLevels - 1)),
      );
    }

    this.setup();
  }

  range(n: $TSFixMe) {
    // eslint-disable-next-line prefer-spread
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

  updateOptions(newOptions: $TSFixMe) {
    this.options = Object.assign(this.options, newOptions);
  }

  update() {
    const minLabel = numberAbbreviate(Math.round(this.options.min));
    const maxLabel = numberAbbreviate(Math.round(this.options.max));
    const minLabelSize = textWidth(minLabel, this.options.fontSize);
    const maxLabelSize = textWidth(maxLabel, this.options.fontSize);
    const cellsWidth = this.options.width - minLabelSize / 2 - maxLabelSize / 2;
    const cellWidth = cellsWidth / this.options.colors.length;

    // remove svg elements leftover from old data
    this.gLabels.selectAll("text").remove();

    this.gCells.selectAll("rect").remove();

    // add svg elements from new data
    this.gLabels
      .selectAll(".legend-text-min")
      .data([this.options.min])
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
      .attr(
        "x",
        (_: $TSFixMe, i: $TSFixMe) =>
          minLabelSize / 2 + Math.floor(cellWidth * i),
      )
      .attr("y", 0)
      .attr("width", Math.ceil(cellWidth))
      .attr("height", this.options.cellHeight)
      .style("fill", (d: $TSFixMe) => d);
  }
}
