import d3 from "d3";
import React from "react";
import { TRANSFORM, TRANSLATE } from "~/helpers/cssConstants";

interface ScatterPlotProps {
  data: $TSFixMe[];
  xKey: string;
  yKey: string;
  width: number;
  height: number;
  xLabel: string;
  yLabel: string;
}

class ScatterPlot extends React.Component<ScatterPlotProps> {
  container: $TSFixMe;
  data: $TSFixMe;
  height: $TSFixMe;
  margin: $TSFixMe;
  scale: $TSFixMe;
  svg: $TSFixMe;
  width: $TSFixMe;
  xKey: $TSFixMe;
  xLabel: $TSFixMe;
  xMinMax: $TSFixMe;
  xScale: $TSFixMe;
  yKey: $TSFixMe;
  yLabel: $TSFixMe;
  yMinMax: $TSFixMe;
  yScale: $TSFixMe;
  componentDidMount() {
    this.renderD3(this.props);
  }

  // eslint-disable-next-line camelcase
  UNSAFE_componentWillReceiveProps(nextProps: ScatterPlotProps) {
    this.renderD3(nextProps);
  }

  renderD3(props: ScatterPlotProps) {
    d3.select(this.container).select("svg").remove();

    this.data = props.data;
    this.margin = {
      top: 10,
      left: 40,
      right: 10,
      bottom: 40,
    };

    this.scale = d3.scale.linear;
    this.xKey = props.xKey || 0;
    this.yKey = props.yKey || 1;

    this.xLabel = props.xLabel || "X-Value";
    this.yLabel = props.yLabel || "Y-Value";
    this.width = props.width || 960;
    this.height = props.height || 500;

    this.width -= this.margin.left + this.margin.right;
    this.height -= this.margin.top + this.margin.bottom;

    this.xMinMax = d3.extent(this.data, (d: $TSFixMe) => {
      return d[this.xKey];
    });
    this.xMinMax = [this.xMinMax[0] - 1, this.xMinMax[1] + 1];

    this.yMinMax = d3.extent(this.data, (d: $TSFixMe) => {
      return d[this.yKey];
    });
    this.yMinMax = [this.yMinMax[0] - 1, this.yMinMax[1] + 1];

    this.xScale = this.scale().domain(this.xMinMax).range([0, this.width]);

    this.yScale = this.scale().domain(this.yMinMax).range([this.height, 0]);

    this.svg = d3
      .select(this.container)
      .append("svg")
      .attr("width", this.width + this.margin.left + this.margin.right)
      .attr("height", this.height + this.margin.top + this.margin.bottom);

    this.renderXAxis();
    this.renderYAxis();
    this.renderPoints();
    this.renderFitLine();
  }
  renderXAxis() {
    const xAxis = d3.svg
      .axis()
      .scale(this.xScale)
      .ticks(10, ".2f")
      .orient("bottom");

    this.svg
      .append("g")
      .attr("class", "x axis")
      .attr(
        TRANSFORM,
        `${TRANSLATE}(${this.margin.left},${this.height + this.margin.top})`,
      )
      .call(xAxis)
      .append("text")
      .attr("class", "label")
      .attr("x", this.width)
      .attr("y", -6)
      .style("text-anchor", "end")
      .text(this.xLabel);
  }

  renderYAxis() {
    const yAxis = d3.svg
      .axis()
      .scale(this.yScale)
      .ticks(10, ",.2f")
      .orient("left");

    this.svg
      .append("g")
      .attr("class", "y axis")
      .attr(TRANSFORM, `${TRANSLATE}(${this.margin.left},${this.margin.top})`)
      .call(yAxis)
      .append("text")
      .attr("class", "label")
      .attr("x", 6)
      .attr("y", 6)
      .text(this.yLabel);
  }

  renderPoints() {
    this.svg
      .append("g")
      .attr("class", "points")
      .attr(
        TRANSFORM,
        "translate(" + this.margin.left + "," + this.margin.top + ")",
      )
      .selectAll(".point")
      .data(this.data)
      .enter()
      .append("circle")
      .attr("class", "point")
      .attr("r", 2)
      .attr("data-x", (d: $TSFixMe) => {
        return d[this.xKey];
      })
      .attr("data-y", (d: $TSFixMe) => {
        return d[this.yKey];
      })
      .attr("cx", (d: $TSFixMe) => {
        return this.xScale(d[this.xKey]);
      })
      .attr("cy", (d: $TSFixMe) => {
        return this.yScale(d[this.yKey]);
      });
  }

  renderFitLine() {
    if (this.data.length < 2) {
      return;
    }
    const leastSquares = this.leastSquares();
    const slope = leastSquares[0];
    const intercept = leastSquares[1];

    const x1 = Math.max((this.yMinMax[0] - intercept) / slope, this.xMinMax[0]);

    this.svg
      .append("g")
      .attr(
        TRANSFORM,
        "translate(" + this.margin.left + "," + this.margin.top + ")",
      )
      .append("line")
      .attr("x1", this.xScale(x1))
      .attr("y1", this.yScale(x1 * slope + intercept))
      .attr("x2", this.xScale(this.xMinMax[1]))
      .attr("y2", this.yScale(this.xMinMax[1] * slope + intercept))
      .classed("trendline", true);
  }

  leastSquares() {
    const xSeries = this.data.map((d: $TSFixMe) => {
      return d[this.xKey];
    });
    const ySeries = this.data.map((d: $TSFixMe) => {
      return d[this.yKey];
    });

    const reduceSumFunc = function(prev: $TSFixMe, cur: $TSFixMe) {
      return prev + cur;
    };

    const xBar = (xSeries.reduce(reduceSumFunc) * 1.0) / xSeries.length;
    const yBar = (ySeries.reduce(reduceSumFunc) * 1.0) / ySeries.length;

    const ssXX = xSeries
      .map(function(d: $TSFixMe) {
        return Math.pow(d - xBar, 2);
      })
      .reduce(reduceSumFunc);

    const ssYY = ySeries
      .map(function(d: $TSFixMe) {
        return Math.pow(d - yBar, 2);
      })
      .reduce(reduceSumFunc);

    const ssXY = xSeries
      .map(function(d: $TSFixMe, i: $TSFixMe) {
        return (d - xBar) * (ySeries[i] - yBar);
      })
      .reduce(reduceSumFunc);

    const slope = ssXY / ssXX;
    const intercept = yBar - xBar * slope;
    const rSquare = Math.pow(ssXY, 2) / (ssXX * ssYY);

    return [slope, intercept, rSquare];
  }

  render() {
    return (
      <div
        className="scatterplot"
        ref={container => {
          this.container = container;
        }}
      />
    );
  }
}

export default ScatterPlot;
