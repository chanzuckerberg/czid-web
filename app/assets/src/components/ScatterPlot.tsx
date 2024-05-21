import d3 from "d3";
import React, { memo, useEffect, useRef } from "react";
import { TRANSFORM, TRANSLATE } from "~/helpers/cssConstants";

const MARGIN_TOP = 10;
const MARGIN_LEFT = 40;
const MARGIN_RIGHT = 10;
const MARGIN_BOTTOM = 40;

interface ScatterPlotProps {
  data: Array<Record<string, number>>;
  xKey: string;
  yKey: string;
  width: number;
  height: number;
  xLabel: string;
  yLabel: string;
}

export default memo(function ScatterPlot(props: ScatterPlotProps) {
  const svgContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    // CALCULATE CONSTANTS:
    const svgWidth = props.width - (MARGIN_LEFT + MARGIN_RIGHT);
    const svgHeight = props.height - (MARGIN_TOP + MARGIN_BOTTOM);
    let xMinMax = d3.extent(
      props.data,
      (d: Record<string, number>) => d[props.xKey],
    );
    let yMinMax = d3.extent(
      props.data,
      (d: Record<string, number>) => d[props.yKey],
    );
    xMinMax = [xMinMax[0] - 1, xMinMax[1] + 1];
    yMinMax = [yMinMax[0] - 1, yMinMax[1] + 1];
    const xScale = d3.scale.linear().domain(xMinMax).range([0, svgWidth]);
    const yScale = d3.scale.linear().domain(yMinMax).range([svgHeight, 0]);
    // RESET SVG:
    d3.select(svgContainerRef.current).select("svg").remove();
    const svg: SVGElement = d3
      .select(svgContainerRef.current)
      .append("svg")
      .attr("width", svgWidth + MARGIN_LEFT + MARGIN_RIGHT)
      .attr("height", svgHeight + MARGIN_TOP + MARGIN_BOTTOM);
    // RENDER CHART:
    renderXAxis(props, svg, svgWidth, svgHeight, xScale);
    renderYAxis(props, svg, yScale);
    renderPoints(props, svg, xScale, yScale);
    renderFitLine(props, svg, xMinMax, yMinMax, xScale, yScale);
  });

  return <div className="scatterplot" ref={svgContainerRef} />;
});

function renderXAxis(
  props: ScatterPlotProps,
  svg,
  width: number,
  height: number,
  scale,
): void {
  const xAxis = d3.svg.axis().scale(scale).ticks(10, ".2f").orient("bottom");

  svg
    .append("g")
    .attr("class", "x axis")
    .attr(TRANSFORM, `${TRANSLATE}(${MARGIN_LEFT},${height + MARGIN_TOP})`)
    .call(xAxis)
    .append("text")
    .attr("class", "label")
    .attr("x", width)
    .attr("y", -6)
    .style("text-anchor", "end")
    .text(props.xLabel);
}

function renderYAxis(props: ScatterPlotProps, svg, scale): void {
  const yAxis = d3.svg.axis().scale(scale).ticks(10, ",.2f").orient("left");

  svg
    .append("g")
    .attr("class", "y axis")
    .attr(TRANSFORM, `${TRANSLATE}(${MARGIN_LEFT},${MARGIN_TOP})`)
    .call(yAxis)
    .append("text")
    .attr("class", "label")
    .attr("x", 6)
    .attr("y", 6)
    .text(props.yLabel);
}

function renderPoints(props: ScatterPlotProps, svg, xScale, yScale): void {
  svg
    .append("g")
    .attr("class", "points")
    .attr(TRANSFORM, "translate(" + MARGIN_LEFT + "," + MARGIN_TOP + ")")
    .selectAll(".point")
    .data(props.data)
    .enter()
    .append("circle")
    .attr("class", "point")
    .attr("r", 2)
    .attr("data-x", (d: Record<string, number>) => d[props.xKey])
    .attr("data-y", (d: Record<string, number>) => d[props.yKey])
    .attr("cx", (d: Record<string, number>) => xScale(d[props.xKey]))
    .attr("cy", (d: Record<string, number>) => yScale(d[props.yKey]));
}

function renderFitLine(
  props: ScatterPlotProps,
  svg,
  xMinMax,
  yMinMax,
  xScale,
  yScale,
): void {
  if (props.data.length < 2) {
    return;
  }
  const { slope, intercept } = leastSquares(props);

  const x1 = Math.max((yMinMax[0] - intercept) / slope, xMinMax[0]);

  svg
    .append("g")
    .attr(TRANSFORM, "translate(" + MARGIN_LEFT + "," + MARGIN_TOP + ")")
    .append("line")
    .attr("x1", xScale(x1))
    .attr("y1", yScale(x1 * slope + intercept))
    .attr("x2", xScale(xMinMax[1]))
    .attr("y2", yScale(xMinMax[1] * slope + intercept))
    .classed("trendline", true);
}

function leastSquares(props: ScatterPlotProps): {
  slope: number;
  intercept: number;
  rSquare: number;
} {
  const xSeries = props.data.map((d: Record<string, number>) => d[props.xKey]);
  const ySeries = props.data.map((d: Record<string, number>) => d[props.yKey]);

  const xBar = xSeries.reduce(sum) / xSeries.length;
  const yBar = ySeries.reduce(sum) / ySeries.length;

  const ssXX = xSeries.map((d: number) => Math.pow(d - xBar, 2)).reduce(sum);

  const ssYY = ySeries.map((d: number) => Math.pow(d - yBar, 2)).reduce(sum);

  const ssXY = xSeries
    .map((d: number, i: number) => (d - xBar) * (ySeries[i] - yBar))
    .reduce(sum);

  const slope = ssXY / ssXX;
  const intercept = yBar - xBar * slope;
  const rSquare = Math.pow(ssXY, 2) / (ssXX * ssYY);

  return { slope, intercept, rSquare };
}

function sum(prev: number, cur: number): number {
  return prev + cur;
}
