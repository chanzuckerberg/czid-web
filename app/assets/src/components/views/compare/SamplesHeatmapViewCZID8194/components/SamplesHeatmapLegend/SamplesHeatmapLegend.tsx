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

  return (
    <div className={cs.samplesHeatmapLegend}>
      <SequentialLegendVis
        min={Math.min(...values.flat())}
        max={Math.max(...values.flat())}
        scale={options.scales[scaleIndex][1]}
      />
    </div>
  );
};
