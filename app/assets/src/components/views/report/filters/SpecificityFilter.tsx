import React from "react";
import Dropdown from "../../../ui/controls/dropdowns/Dropdown";

const SPECIFICITY_OPTIONS = [
  { text: "All", value: 0 },
  { text: "Specific Only", value: 1 },
];

interface SpecificityFilterProps {
  disabled?: boolean;
  onChange: (value: string) => void;
  value: number;
}

const SpecificityFilter = ({
  value,
  onChange,
  disabled = false,
}: SpecificityFilterProps) => {
  return (
    <Dropdown
      options={SPECIFICITY_OPTIONS}
      value={value}
      label="Read Specificity"
      onChange={onChange}
      rounded
      disabled={disabled}
    />
  );
};

export default SpecificityFilter;
