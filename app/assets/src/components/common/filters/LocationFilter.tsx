import { forEach, values, sortBy } from "lodash/fp";
import React from "react";
import { BaseMultipleFilter } from "~/components/common/filters";
import { BaseMultipleFilterProps, FilterOption } from "./BaseMultipleFilter";

const LocationFilter = ({
  options,
  selected,
  onChange,
  label,
}: LocationFilterProps) => {
  const expandParents = (options: LocationFilterProps["options"]) => {
    const mergedOptions = {} as { [key: string]: FilterOption };
    forEach(option => {
      // Tally parents
      forEach(parent => {
        if (!mergedOptions[parent]) {
          mergedOptions[parent] = {
            text: parent,
            value: parent,
            count: option.count,
          };
        } else {
          mergedOptions[parent].count += option.count;
        }
      }, option.parents || []);

      // Tally current option
      const val = option.value;
      if (!mergedOptions[val]) {
        mergedOptions[val] = {
          text: option.text,
          value: val,
          count: option.count,
        };
      } else {
        mergedOptions[val].count += option.count;
      }
    }, options);
    return values(mergedOptions);
  };
  return (
    <BaseMultipleFilter
      selected={selected}
      onChange={onChange}
      label={label}
      options={sortBy("text", expandParents(options))}
    />
  );
};

interface LocationFilterProps extends Omit<BaseMultipleFilterProps, "options"> {
  options: { count: number; parents: string[]; text: string; value: string }[];
}

export default LocationFilter;
