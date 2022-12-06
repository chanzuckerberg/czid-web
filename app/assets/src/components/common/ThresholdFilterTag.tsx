import React from "react";
import ThresholdMap, {
  ThresholdConditions,
} from "~/components/utils/ThresholdMap";
import FilterTag from "~ui/controls/FilterTag";

interface ThresholdFilterTagProps {
  onClose: () => void;
  disabled?: boolean;
  threshold: ThresholdConditions;
  className: string;
}

const ThresholdFilterTag = ({
  threshold,
  onClose,
  disabled,
  className,
}: ThresholdFilterTagProps) => {
  const text = `${threshold.metricDisplay} ${threshold.operator} ${threshold.value}`;

  if (ThresholdMap.isThresholdValid(threshold)) {
    return (
      <FilterTag
        text={text}
        onClose={onClose}
        className={className}
        disabled={disabled}
      />
    );
  }
  return null;
};

export default ThresholdFilterTag;
