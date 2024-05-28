import React from "react";
import { ERCCComparisonShape } from "~/interface/shared";
import { ScatterPlot } from "./components/ScatterPlot";
import cs from "./ercc_scatterplot.scss";

interface ERCCScatterPlotProps {
  width: number;
  height: number;
  erccComparison?: ReadonlyArray<ERCCComparisonShape | null | undefined>;
}

export const ERCCScatterPlot = (props: ERCCScatterPlotProps) => {
  const data: { actual: number; expected: number }[] = [];

  if (props.erccComparison) {
    for (const row of props.erccComparison) {
      if (!row) {
        continue;
      }
      if (row.actual === 0 || row.actual === null || row.actual === undefined) {
        continue;
      }
      if (row.expected === null || row.expected === undefined) {
        continue;
      }
      data.push({
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
