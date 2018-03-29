import React from 'react';
import d3, {event as currentEvent} from 'd3';

class ScatterPlot extends React.Component {
  componentDidMount() {
    this.renderD3(this.props);
  }
  componentWillReceiveProps (nextProps) {
    d3.select(this.container).select("svg").remove();
    this.renderD3(nextProps);
  }

  renderD3 (props) {
    this.data = props.data;
    this.margin = {
      top: 10,
      left: 30,
      right: 10,
      bottom: 30,
    };

    this.width = props.width || 960;
    this.height = props.height || 500;
    let xMinMax = d3.extent(this.data, function(d) { return d[0]; });
    let yMinMax = d3.extent(this.data, function(d) { return d[1]; });
    this.xScale = d3.scale.linear().range([0, this.width])
                    .domain([xMinMax[0] - 1, xMinMax[1] + 1]);

    this.yScale = d3.scale.linear().range([this.height, 0])
                    .domain([yMinMax[0] - 1, yMinMax[1] + 1]);

    this.svg = d3.select(this.container).append("svg")
        .attr("width", this.width + this.margin.left + this.margin.right)
        .attr("height", this.height + this.margin.top + this.margin.bottom);

    this.renderXAxis();
    this.renderYAxis();
    this.renderPoints();
		this.renderFitLine();
  }
  renderXAxis () {
		var xAxis = d3.svg.axis()
        .scale(this.xScale)
        .orient("bottom");

		this.svg.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(" + this.margin.left + "," + (this.height + this.margin.top) + ")")
        .call(xAxis)
        .append("text")
        .attr("class", "label")
        .attr("x", this.width)
        .attr("y", -6)
        .style("text-anchor", "end")
        .text("X-Value");
  }

  renderYAxis () {
		var yAxis = d3.svg.axis()
        .scale(this.yScale)
        .orient("left");

		this.svg.append("g")
        .attr("class", "y axis")
        .attr("transform", "translate(" + this.margin.left + "," + (this.margin.top) + ")")
        .call(yAxis)
        .append("text")
        .attr("class", "label")
        .attr("x", 6)
        .attr("y", 6)
        .text("y-Value");
  }

  renderPoints () {
		this.svg.append("g")
      .attr("class", "points")
      .attr("transform", "translate(" + this.margin.left + "," + this.margin.top + ")")
      .selectAll(".point")
			.data(this.data)
			.enter().append("circle")
			.attr("class", "point")
			.attr("r", 2)
			.attr("cx", (d) => {
				return this.xScale(d[0]);
			})
			.attr("cy", (d) => {
				return this.yScale(d[1]);
			});
  }

  renderFitLine () {
    let leastSquares = this.leastSquares();
    let slope = leastSquares[0];
    let intercept = leastSquares[1];
    let rSquare = leastSquares[2];
		this.svg
        .append("g")
        .attr("transform", "translate(" + this.margin.left + "," + this.margin.top + ")")
        .append("line")
        .attr("x1", this.xScale(0))
        .attr("y1", this.yScale(intercept))
        .attr("x2", this.xScale(9))
        .attr("y2", this.yScale(9*slope + intercept))
        .classed("trendline", true);
  }

  leastSquares () {
	 	let xSeries = this.data.map(function(d) { return d[0] });
    let ySeries = this.data.map(function(d) { return d[1] });

    let reduceSumFunc = function(prev, cur) { return prev + cur; };

    let xBar = xSeries.reduce(reduceSumFunc) * 1.0 / xSeries.length;
    let yBar = ySeries.reduce(reduceSumFunc) * 1.0 / ySeries.length;

    let ssXX = xSeries.map(function(d) { return Math.pow(d - xBar, 2); })
      .reduce(reduceSumFunc);

    let ssYY = ySeries.map(function(d) { return Math.pow(d - yBar, 2); })
      .reduce(reduceSumFunc);

    let ssXY = xSeries.map(function(d, i) { return (d - xBar) * (ySeries[i] - yBar); })
      .reduce(reduceSumFunc);

    let slope = ssXY / ssXX;
    let intercept = yBar - (xBar * slope);
    let rSquare = Math.pow(ssXY, 2) / (ssXX * ssYY);

    return [slope, intercept, rSquare];
  }

  render () {
    return (
      <div className="scatterplot" ref={(container) => { this.container = container; }} />
    );
  }
}

export default ScatterPlot;
