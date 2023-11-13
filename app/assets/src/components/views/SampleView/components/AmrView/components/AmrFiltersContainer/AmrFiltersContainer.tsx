import { cx } from "@emotion/css";
import { filter, forEach, map, split, trim } from "lodash/fp";
import React, { useCallback, useContext, useEffect } from "react";
import { FilterButtonWithCounter } from "~/components/ui/controls/buttons/FilterButtonWithCounter";
import { ThresholdFilterData } from "~/interface/dropdown";
import { AmrContext } from "../../amrContext/reducer";
import { ColumnId } from "../../constants";
import { AmrResult } from "../AmrSampleReport/types";
import cs from "./amr_filters_container.scss";
import { AmrThresholdFilters } from "./components/AmrThresholdFilters";
import { DrugClassFilter } from "./components/DrugClassFilter";
import { thresholdFilterOptionColumnIds } from "./constants";
import { FiltersType, FilterType, TypeFilterType } from "./types";
import { countActiveFilters, getAmrColumnTransform } from "./utils";

interface AmrFiltersContainerProps {
  setDataFilterFunc: (filterFunc: any) => void;
  hideFilters: boolean;
  setHideFilters: (hideFilters: boolean) => void;
}

export const THRESHOLD_FILTER_INIT = thresholdFilterOptionColumnIds.reduce(
  (obj, item) => {
    const transform = getAmrColumnTransform(item);

    obj[item] = {
      key: item,
      params: {
        thresholdFilters: [],
      },
      transform,
      type: TypeFilterType.THRESHOLD,
    };
    return obj;
  },
  {},
);

const DRUG_CLASS_FILTER_INIT = {
  [ColumnId.DRUG_CLASS]: {
    key: ColumnId.DRUG_CLASS,
    params: {
      multiSelected: [],
    },
    transform: (d: AmrResult) => map(trim, split(";", d.drugClass)),
    type: TypeFilterType.MULTIPLE,
  },
};

// * `key` should be the ColumnId of the column you are filtering on
// Merge inital values for additional filters here
export const DATA_FILTER_INIT: FiltersType = {
  ...THRESHOLD_FILTER_INIT,
  ...DRUG_CLASS_FILTER_INIT,
};

const applyFilter = (data: AmrResult[], dataFilter: FilterType) => {
  if (!data) return [];

  const { key, params, transform, type } = dataFilter;
  if (!key || !params || !type) return data;
  const { thresholdFilters, selected, multiSelected = [] } = params;

  switch (type) {
    case TypeFilterType.THRESHOLD:
      if (!thresholdFilterOptionColumnIds.includes(key)) return data;
      return filter(d => {
        const value = transform ? transform(d) : d;

        // Go through the list of threshold filters. If the value of the row fails
        // any threshold filter, return false. Otherwise return true. This will end
        // early if there is a failure rather than checking every threshold.
        const doesFailThresholdFilter =
          thresholdFilters &&
          !!thresholdFilters.find((thresholdFilter: ThresholdFilterData) => {
            // Note: true indicates that the value "doesFail" the threshold
            // This check is inside the find because we want to return the NaN value
            // if there is not a filter in place
            if (isNaN(value)) return true;

            const parsedThresholdFilterValue = parseFloat(
              thresholdFilter.value,
            );
            if (thresholdFilter.operator === "<=") {
              return value > parsedThresholdFilterValue; // Note: using > because we are looking for failures
            }
            if (thresholdFilter.operator === ">=") {
              return value < parsedThresholdFilterValue; // Note: using < because we are looking for failures
            }
          });
        return !doesFailThresholdFilter;
      }, data);
    case TypeFilterType.MULTIPLE:
      if (!multiSelected || multiSelected.length === 0) return data;
      return filter(d => {
        const value = transform ? transform(d) : d;
        return multiSelected.some((selected: string) =>
          value.includes(selected),
        );
      }, data);
    case TypeFilterType.SINGLE:
      if (!selected) return data;

      return filter(d => {
        const value = transform ? transform(d) : d;
        return selected === value;
      }, data);
    default:
      return data;
  }
};

export const AmrFiltersContainer = ({
  setDataFilterFunc,
  hideFilters,
  setHideFilters,
}: AmrFiltersContainerProps) => {
  const activeFilters = useContext(AmrContext)?.amrContextState?.activeFilters;
  const nActiveFilters = activeFilters ? countActiveFilters(activeFilters) : 0;

  const wrappedFilterFunc = useCallback(() => {
    const filterFunc = (filters: FiltersType | null) => {
      return (data: AmrResult[]) => {
        let filteredData = [...data];
        if (!filters) return filteredData;
        forEach((filter: FilterType) => {
          filteredData = applyFilter(filteredData, filter);
        }, filters);
        return filteredData;
      };
    };
    return filterFunc(activeFilters);
  }, [activeFilters]);

  // set the data filter function (using setDataFilterFunc callback) based on the current dataFilters
  useEffect(() => {
    setDataFilterFunc(wrappedFilterFunc);
  }, [setDataFilterFunc, wrappedFilterFunc]);

  return (
    <div className={cs.filtersContainer}>
      <div
        className={cx(
          cs.filtersContent,
          hideFilters ? cs.filtersContentClosed : cs.filtersContentOpen,
        )}
      >
        <FilterButtonWithCounter
          filterCounter={nActiveFilters}
          onFilterToggle={() => setHideFilters(!hideFilters)}
          showFilters={!hideFilters}
          popupPosition="top left"
        />
        <div className={hideFilters ? cs.hideFilters : undefined}>
          <div className={cs.filters}>
            <h2 className={cs.sectionTitle}>Filters</h2>
            <AmrThresholdFilters hideFilters={hideFilters} />
            <DrugClassFilter hideFilters={hideFilters} />
          </div>
        </div>
      </div>
    </div>
  );
};
