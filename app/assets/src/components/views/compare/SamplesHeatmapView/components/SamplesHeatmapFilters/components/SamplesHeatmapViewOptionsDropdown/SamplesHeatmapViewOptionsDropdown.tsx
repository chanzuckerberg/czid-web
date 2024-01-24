import { Dropdown } from "@czi-sds/components";
import React from "react";
import { SDSFormattedOption } from "../../SamplesHeatmapFilters";
import {
  valueToName,
  valueToSDSFormatOption,
} from "../../samplesHeatmapFilterUtils";
import cs from "./samples_heatmap_view_options_dropdown.scss";

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

  const getOptionDisabled = (option: SDSFormattedOption) => option.disabled;

  return (
    <Dropdown
      value={valueToSDSFormatOption(
        selectedOptions[selectedOptionsKey],
        options,
      )}
      onChange={(newValue: SDSFormattedOption) => onChange(newValue)}
      label={<div className={cs.label}>{label}</div>}
      options={options}
      InputDropdownProps={{
        sdsStyle: "minimal",
        disabled: disabled,
        sdsType: "label",
        value: selectedOptionName,
      }}
      DropdownMenuProps={{
        getOptionDisabled: getOptionDisabled,
        isOptionEqualToValue: (
          option: SDSFormattedOption,
          value: SDSFormattedOption,
        ) => {
          return option.value === value.value;
        },
      }}
    />
  );
};
