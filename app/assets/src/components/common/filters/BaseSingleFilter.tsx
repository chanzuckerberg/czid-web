import { kebabCase } from "lodash/fp";
import React from "react";
import { BareDropdown as Dropdown } from "~ui/controls/dropdowns";
import { FilterOption } from "./BaseMultipleFilter";
import cs from "./filters.scss";

const BaseSingleFilter = ({
  label,
  onChange,
  options,
  value,
}: BaseSingleFilterProps) => {
  return (
    <Dropdown
      trigger={
        <div data-testid={kebabCase(label)} className={cs.filterLabel}>
          {label}
        </div>
      }
      menuLabel={`Select ${label}`}
      options={options}
      onChange={onChange}
      value={value}
    />
  );
};

interface BaseSingleFilterProps {
  value: string | number;
  onChange: (selected: string) => void;
  options: FilterOption[];
  label: string;
}

export default BaseSingleFilter;
