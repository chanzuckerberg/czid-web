import React from "react";
import SequentialLegendVis from "~/components/visualizations/legends/SequentialLegendVis";
import cs from "./samples_heatmap_legend.scss";

interface SamplesHeatmapLegendPropsType {
  data: any;
  loading: boolean;
  selectedOptions: any;
  options: any;
}

export const SamplesHeatmapLegend = ({
  data,
  loading,
  selectedOptions,
  options,
}: SamplesHeatmapLegendPropsType) => {
  if (loading || !data || !(data[selectedOptions.metric] || []).length) {
    return;
  }
  const values = data[selectedOptions.metric];
  const scaleIndex = selectedOptions.dataScaleIdx;

  const getNestedMin = (
    arrayOfArrays: Array<Array<number>>,
    lowerBound = 0,
  ) => {
    const minOfEachArray = arrayOfArrays.map(array => Math.min(...array));
    const minOfAllArrays = Math.min(...minOfEachArray);
    return Math.max(minOfAllArrays, lowerBound);
  };

  const getNestedMax = (arrayOfArrays: Array<Array<number>>) => {
    const maxOfEachArray = arrayOfArrays.map(array => Math.max(...array));
    return Math.max(...maxOfEachArray);
  };

  return (
    <div className={cs.samplesHeatmapLegend}>
      <SequentialLegendVis
        min={getNestedMin(values, 0)}
        max={getNestedMax(values)}
        scale={options.scales[scaleIndex][1]}
      />
    </div>
  );
};
