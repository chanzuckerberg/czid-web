import React from "react";
import ColumnHeaderTooltip from "~/components/ui/containers/ColumnHeaderTooltip";

export const SamplesHeatmapPresetTooltip = ({
  component,
  className,
  key,
}: {
  component: $TSFixMe;
  className?: string;
  key?: string;
}) => {
  return (
    <ColumnHeaderTooltip
      key={key}
      // need include a span for the tooltip to appear on hover
      trigger={<span className={className}>{component}</span>}
      content={`Presets cannot be modified. Click "New Presets" to adjust this filter.`}
    />
  );
};
