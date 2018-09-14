import d3 from "d3";
import NumAbbreviate from "number-abbreviate";
import ObjectHelper from "../../helpers/ObjectHelper";
import React from "react";

export default class HeatmapLegend extends React.Component {
  componentDidMount() {
    this.renderD3(this.props);
  }
  componentWillReceiveProps(nextProps) {
    if (ObjectHelper.shallowEquals(nextProps, this.props)) {
      return;
    }
    d3
      .select(this.container)
      .select("svg")
      .remove();
    this.renderD3(nextProps);
  }
  renderD3(props) {
    this.svg = d3
      .select(this.container)
      .append("svg")
      .attr("width", "100%")
      .attr("height", "35");
    let that = this,
      height = 20,
      legendElementWidth = 100 / props.colors.length;
    this.svg
      .selectAll(".legend-text-min")
      .data([this.min])
      .enter()
      .append("text")
      .attr("x", 0)
      .attr("y", 35)
      .attr("class", "mono")
      .text(NumAbbreviate(Math.round(props.min)));
    this.svg
      .selectAll(".legend-text-max")
      .data([props.max])
      .enter()
      .append("text")
      .attr("class", "mono")
      .attr("x", "100%")
      .attr("y", 35)
      .text(NumAbbreviate(Math.round(props.max)))
      .style("text-anchor", "end");
    var legend = this.svg
      .selectAll(".legend")
      .data(props.colors)
      .enter()
      .append("g")
      .attr("class", "legend");
    legend
      .append("rect")
      .attr("x", function(d, i) {
        return Math.floor(legendElementWidth * i) + "%";
      })
      .attr("y", 0)
      .attr("width", Math.ceil(legendElementWidth) + "%")
      .attr("height", height)
      .style("fill", function(d, i) {
        return that.props.colors[i];
      });
    this.svg
      .append("rect")
      .attr("x", "0")
      .attr("stroke", "#aaa")
      .attr("stroke-width", "0.25")
      .style("fill", "none")
      .attr("y", 0)
      .attr("width", "100%")
      .attr("height", height);
  }
  render() {
    return (
      <div
        className="heatmap-legend"
        ref={container => {
          this.container = container;
        }}
      />
    );
  }
}
