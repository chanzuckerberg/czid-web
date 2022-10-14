import React from "react";
import Dropdown from "../../../ui/controls/dropdowns/Dropdown";

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
      // @ts-expect-error Type '{ text?: string; value?: string; }[]' is not assignable to type
      options={options}
      value={value}
      label="Tree Metric"
      onChange={onChange}
      rounded
    />
  );
};

export default MetricPicker;
