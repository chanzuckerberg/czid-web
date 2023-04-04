import React from "react";
import cs from "./ercc_scatterplot.scss";
import ScatterPlot from "./ScatterPlot";

interface ERCCScatterPlotProps {
  width?: number;
  height?: number;
  ercc_comparison?: {
    name: string;
    actual: number;
    expected: number;
  }[];
}

const ERCCScatterPlot = (props: ERCCScatterPlotProps) => {
  const data = [];
  if (props.ercc_comparison) {
    for (const row of props.ercc_comparison) {
      if (row.actual === 0) {
        continue;
      }
      data.push({
        name: row.name,
        actual: Math.log10(row.actual),
        expected: Math.log10(row.expected),
      });
    }
  }
  if (!data.length) {
    return <div className={cs.noData}>No data</div>;
  }

  return (
    <ScatterPlot
      data={data}
      xKey="expected"
      yKey="actual"
      width={props.width}
      height={props.height}
      xLabel="log10 spike-in concentrations"
      yLabel="log10 read-pairs per gene"
    />
  );
};

export default ERCCScatterPlot;
