import React from "react";
import Dropdown from "~/components/ui/controls/dropdowns/Dropdown";
import { HeatmapDownloadType } from "~/components/views/compare/SamplesHeatmapView/constants";
import cs from "./metric_dropdown.scss";

interface MetricDropdownProps {
  downloadType: HeatmapDownloadType;
  handleSelectMetric: (downloadType, value) => void;
  metricOptions?: { text: string; value: string }[];
  selectedMetricValue: string;
}

export const MetricDropdown = ({
  downloadType,
  handleSelectMetric,
  metricOptions,
  selectedMetricValue,
}: MetricDropdownProps) => {
  if (!metricOptions) {
    return null;
  }

  return (
    <div
      className={cs.metricDropdownWrapper}
      key={`${downloadType}-metric-dropdown`}
    >
      <div className={cs.label}>Download Metric:</div>
      <Dropdown
        fluid
        placeholder="Select metric"
        options={metricOptions}
        onChange={(value: string) => {
          handleSelectMetric(downloadType, value);
        }}
        value={selectedMetricValue}
        usePortal
        withinModal
      />
    </div>
  );
};
