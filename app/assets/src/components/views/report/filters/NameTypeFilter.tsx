import React from "react";
import Dropdown from "../../../ui/controls/dropdowns/Dropdown";

const NAME_TYPE_OPTIONS = [
  { text: "Scientific", value: "Scientific name" },
  { text: "Common", value: "Common name" },
];

interface NameTypeFilterProps {
  disabled?: boolean;
  onChange: $TSFixMeFunction;
  value: string;
}

const NameTypeFilter = ({
  value,
  onChange,
  disabled = false,
}: NameTypeFilterProps) => {
  return (
    <Dropdown
      options={NAME_TYPE_OPTIONS}
      value={value}
      label="Name Type"
      onChange={onChange}
      rounded
      disabled={disabled}
    />
  );
};

export default NameTypeFilter;
