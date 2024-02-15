import { kebabCase } from "lodash/fp";
import React from "react";
import { MultipleDropdown } from "~ui/controls/dropdowns";
import cs from "./filters.scss";

const BaseMultipleFilter = ({
  label,
  onChange,
  options,
  selected,
}: BaseMultipleFilterProps) => {
  return (
    <MultipleDropdown
      checkedOnTop
      search
      fluid
      arrowInsideTrigger={false}
      trigger={
        <div data-testid={kebabCase(label)} className={cs.filterLabel}>
          {label}
        </div>
      }
      menuLabel={`Select ${label}`}
      options={options}
      value={selected}
      onChange={onChange}
    />
  );
};

export interface FilterOption {
  count: number;
  text: string;
  value: string;
}

export interface BaseMultipleFilterProps {
  selected: string[] | number[];
  onChange: (selected: string[]) => void;
  options: FilterOption[];
  label: string;
}

export default BaseMultipleFilter;
