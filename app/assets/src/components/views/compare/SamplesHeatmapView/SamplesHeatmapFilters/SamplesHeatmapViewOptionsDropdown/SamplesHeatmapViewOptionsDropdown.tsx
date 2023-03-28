import { Dropdown } from "czifui";
import React from "react";
import { SDSFormattedOption } from "../SamplesHeatmapFilters";
import {
  valueToName,
  valueToSDSFormatOption,
} from "../samplesHeatmapFilterUtils";

interface SamplesHeatmapViewOptionsDropdownPropsType {
  disabled: boolean;
  label: string;
  onChange: (SDSFormattedOption) => void;
  options: Array<SDSFormattedOption>;
  selectedOptions: $TSFixMe;
  selectedOptionsKey: string;
  customValueToNameFunction?: (
    value: string | number,
    options?: SDSFormattedOption[],
  ) => string;
}

export const SamplesHeatmapViewOptionsDropdown = ({
  disabled,
  label,
  onChange,
  options,
  selectedOptions,
  selectedOptionsKey,
  customValueToNameFunction,
}: SamplesHeatmapViewOptionsDropdownPropsType) => {
  const selectedOptionValue = selectedOptions[selectedOptionsKey];
  const selectedOptionName = customValueToNameFunction
    ? customValueToNameFunction(selectedOptionValue, options)
    : valueToName(selectedOptionValue, options);

  return (
    <Dropdown
      value={valueToSDSFormatOption(
        selectedOptions[selectedOptionsKey],
        options,
      )}
      onChange={(newValue: SDSFormattedOption) => onChange(newValue)}
      label={label}
      options={options}
      InputDropdownProps={{
        sdsStyle: "minimal",
        disabled: disabled,
        details: selectedOptionName,
      }}
    />
  );
};
