import React, { useState } from "react";
import ThresholdFilterSDS from "~/components/common/filters/ThresholdFilterSDS";
import { ThresholdFilterData } from "~/interface/dropdown";
import { COLUMN_ID_TO_NAME } from "../../../../constants";
import { thresholdFilterOptionColumnIds } from "../../constants";
import { UpdateThresholdFiltersType } from "../../types";

interface AmrThresholdFiltersProps {
  updateThresholdFilters: (filtersData: UpdateThresholdFiltersType) => void;
}

/*
 * The updateThresholdFilters function takes an object with keys corresponding
 * to the columns in the table. There can be multiple filters for each column,
 * so we are deduplicating here.
 */
const convertThresholdFilters = (
  thresholdFilters: ThresholdFilterData[],
): UpdateThresholdFiltersType => {
  const allUpdateThresholdFilters: UpdateThresholdFiltersType =
    thresholdFilterOptionColumnIds.reduce((obj, columnId) => {
      obj[columnId] = {
        filterKey: columnId,
        lowerBound: undefined,
        upperBound: undefined,
      };
      return obj;
    }, {});

  // For each threshold filter in the filters array, update the corresponding
  // filter in the allUpdateThresholdFilters object. This will deduplicate
  // threshold filters that correspond to the same filterKey.
  thresholdFilters.forEach(thresholdFilter => {
    const newThresholdValue = parseFloat(thresholdFilter.value);
    if (isNaN(newThresholdValue)) {
      return;
    }

    const currentUpdateThresholdFilter =
      allUpdateThresholdFilters[thresholdFilter.metric];

    if (thresholdFilter.operator === ">=") {
      // If the operator is greater than or equal to, set the lower bound to the higher of the existing value and the new value
      const currentLowerBound = currentUpdateThresholdFilter.lowerBound;
      currentUpdateThresholdFilter.lowerBound = currentLowerBound
        ? Math.max(newThresholdValue, currentLowerBound)
        : newThresholdValue;
    } else {
      // If the operator is less than or equal to, set the upper bound to the lower of the existing value and the new value
      const currentUpperBound = currentUpdateThresholdFilter.upperBound;
      currentUpdateThresholdFilter.upperBound = currentUpperBound
        ? Math.min(newThresholdValue, currentUpperBound)
        : newThresholdValue;
    }
  });

  return allUpdateThresholdFilters;
};

export const AmrThresholdFilters = ({
  updateThresholdFilters,
}: AmrThresholdFiltersProps) => {
  const [thresholdFilters, setThresholdFilters] = useState<
    ThresholdFilterData[]
  >([]);

  const handleApply = (filterData: ThresholdFilterData[]) => {
    setThresholdFilters(filterData);
    updateThresholdFilters(convertThresholdFilters(filterData));
  };

  return (
    <ThresholdFilterSDS
      selectedThresholds={thresholdFilters}
      onApply={handleApply}
      disabled={false}
      metricOptions={thresholdFilterOptionColumnIds.map(columnId => ({
        text: COLUMN_ID_TO_NAME.get(columnId),
        value: columnId,
      }))}
    />
  );
};
