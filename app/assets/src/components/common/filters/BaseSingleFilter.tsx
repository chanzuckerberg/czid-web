import React from "react";
import { BareDropdown as Dropdown } from "~ui/controls/dropdowns";
import { FilterOption } from "./BaseMultipleFilter";
import cs from "./filters.scss";

const BaseSingleFilter = ({
  label,
  onChange,
  options,
  selected,
}: BaseSingleFilterProps) => {
  return (
    <Dropdown
      trigger={<div className={cs.filterLabel}>{label}</div>}
      menuLabel={`Select ${label}`}
      options={options}
      onChange={onChange}
      value={selected}
    />
  );
};

interface BaseSingleFilterProps {
  selected: string | number;
  onChange: (selected: string) => void;
  options: FilterOption[];
  label: string;
}

export default BaseSingleFilter;
