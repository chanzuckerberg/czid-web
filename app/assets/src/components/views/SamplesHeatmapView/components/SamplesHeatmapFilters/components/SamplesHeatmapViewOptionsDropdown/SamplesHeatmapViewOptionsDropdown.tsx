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
  onChange: (option: SDSFormattedOption) => void;
  options: Array<SDSFormattedOption>;
  selectedOptions: $TSFixMe;
  selectedOptionsKey: string;
  customValueToNameFunction?: (
    value: string | number,
    options?: SDSFormattedOption[],
  ) => string;
  renderOption?: (optionProps: any, option: SDSFormattedOption) => JSX.Element;
}

export const SamplesHeatmapViewOptionsDropdown = ({
  disabled,
  label,
  onChange,
  options,
  selectedOptions,
  selectedOptionsKey,
  customValueToNameFunction,
  renderOption,
}: SamplesHeatmapViewOptionsDropdownPropsType) => {
  const selectedOptionValue = selectedOptions[selectedOptionsKey];
  const selectedOptionName = customValueToNameFunction
    ? customValueToNameFunction(selectedOptionValue, options)
    : valueToName(selectedOptionValue, options);

  const getIsOptionDisabled = (option: SDSFormattedOption) => option.disabled;

  return (
    <Dropdown
      value={valueToSDSFormatOption(
        selectedOptions[selectedOptionsKey],
        options,
      )}
      onChange={(newValue: SDSFormattedOption) => onChange(newValue)}
      label={<div className={cs.label}>{label}</div>}
      options={options}
      DropdownMenuProps={{
        getOptionDisabled: getIsOptionDisabled,
        isOptionEqualToValue: (
          option: SDSFormattedOption,
          value: SDSFormattedOption,
        ) => {
          return option.value === value.value;
        },
        renderOption: renderOption,
      }}
      InputDropdownProps={{
        sdsStyle: "minimal",
        disabled: disabled,
        sdsType: "label",
        value: selectedOptionName,
      }}
    />
  );
};
