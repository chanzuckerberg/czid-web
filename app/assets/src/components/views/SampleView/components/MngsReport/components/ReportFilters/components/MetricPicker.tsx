import React from "react";
import Dropdown from "~/components/ui/controls/dropdowns/Dropdown";

interface MetricPickerProps {
  value: string;
  onChange: $TSFixMeFunction;
  options?: {
    text?: string;
    value?: string;
  }[];
}

const MetricPicker = ({ value, onChange, options }: MetricPickerProps) => {
  return (
    <Dropdown
      // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2322
      options={options}
      value={value}
      label="Tree Metric"
      onChange={onChange}
      rounded
    />
  );
};

export default MetricPicker;
