import { useReactiveVar } from "@apollo/client";
import { filter, forEach } from "lodash/fp";
import React, { useEffect, useState } from "react";
import { activeAmrFiltersVar } from "~/cache/initialCache";
import FilterPanel from "~/components/layout/FilterPanel";
import { FilterButtonWithCounter } from "~/components/ui/controls/buttons/FilterButtonWithCounter";
import { ColumnId } from "../../constants";
import { AmrResult } from "../AmrSampleReport/types";
import cs from "./amr_filters_container.scss";
import { AmrThresholdFilters } from "./components/AmrThresholdFilters";
import { thresholdFilterOptionColumnIds } from "./constants";
import {
  FilterParamsType,
  FiltersType,
  FilterType,
  TypeFilterType,
  UpdateThresholdFiltersType,
} from "./types";
import { countActiveFilters } from "./utils";

interface AmrFiltersContainerProps {
  setDataFilterFunc: (filterFunc: any) => void;
  hideFilters: boolean;
  setHideFilters: (hideFilters: boolean) => void;
}

const THRESHOLD_FILTER_INIT = thresholdFilterOptionColumnIds.reduce(
  (obj, item) => {
    let transform;
    // rPM and dPM are the only columns where the lookup key is different from the columnId
    // rPM and dPM are also the only columns with number values instead of strings
    if (item === ColumnId.READS_PER_MILLION) {
      transform = (d: AmrResult) => d.rpm;
    } else if (item === ColumnId.READ_DEPTH_PER_MILLION) {
      transform = (d: AmrResult) => d.dpm;
    } else {
      transform = (d: AmrResult) => parseFloat(d[item]);
    }

    obj[item] = {
      key: item,
      params: {
        lowerBound: undefined,
        upperBound: undefined,
      },
      transform,
      type: TypeFilterType.THRESHOLD,
    };
    return obj;
  },
  {},
);

// * `key` should be the ColumnId of the column you are filtering on
// Merge inital values for additional filters here
const DATA_FILTER_INIT: FiltersType = {
  ...THRESHOLD_FILTER_INIT,
};

const applyFilter = (data: AmrResult[], dataFilter: FilterType) => {
  if (!data) return [];

  const { key, params, transform, type } = dataFilter;
  if (!key || !params || !type) return data;
  const { lowerBound, upperBound, selected, multiSelected = [] } = params;

  switch (type) {
    case TypeFilterType.THRESHOLD:
      if (!lowerBound && !upperBound) return data;

      return filter(d => {
        const value = transform ? transform(d) : d;

        // Check each row of the data to see if it passes this threshold filter
        const doesPassFilterCheckLowerBound =
          !lowerBound || value >= lowerBound;
        const doesPassFilterCheckUpperBound =
          !upperBound || value <= upperBound;

        return doesPassFilterCheckLowerBound && doesPassFilterCheckUpperBound;
      }, data);
    case TypeFilterType.MULTIPLE:
      if (multiSelected.length === 0) return data;

      return filter(d => {
        const value = transform ? transform(d) : d;
        return multiSelected.includes(value);
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
  // If filters are hidden, set the width of the FilterPanel to 65px, otherwise set it to 200px
  const drawerWidth = hideFilters ? 50 : 200;

  const [dataFilters, setDataFilters] = useState<FiltersType>(DATA_FILTER_INIT);

  // set the data filter function (using setDataFilterFunc callback) based on the current dataFilters
  useEffect(() => {
    const wrappedFilterFunc = () => {
      const filterFunc = (filters: FiltersType) => {
        return (data: AmrResult[]) => {
          let filteredData = [...data];
          forEach((filter: FilterType) => {
            filteredData = applyFilter(filteredData, filter);
          }, filters);
          return filteredData;
        };
      };
      return filterFunc(dataFilters);
    };

    setDataFilterFunc(wrappedFilterFunc);
  }, [dataFilters, setDataFilterFunc]);

  // Generic update function that will be used by the more-specific update functions below
  // NOTE: there is only one filterKey for each filter type. The threshold filters will be
  // deduplicated in the AmrThresholdFilters component
  const updateDataFilters = (
    filters: { filterKey: string; params: FilterParamsType }[],
  ) => {
    const newFilters = { ...dataFilters };
    forEach(({ filterKey, params }) => {
      const { transform, type } = dataFilters[filterKey];
      newFilters[filterKey] = {
        key: filterKey,
        params,
        transform,
        type,
      };
    }, filters);
    setDataFilters(newFilters);
  };

  const updateThresholdFilters = (filtersData: UpdateThresholdFiltersType) => {
    const filtersList = [];
    for (const filterKey in filtersData) {
      const { lowerBound, upperBound } = filtersData[filterKey];
      const params = {
        lowerBound,
        upperBound,
      };
      filtersList.push({ filterKey, params });
    }
    updateDataFilters(filtersList);
  };

  const activeAmrFilters = useReactiveVar(activeAmrFiltersVar);
  const numOfActiveAmrFilters = countActiveFilters(activeAmrFilters);

  return (
    <FilterPanel
      // The filter panel should always be present, the only things that should be hidden are the filters themselves.
      hideFilters={false}
      content={
        <div className={cs.filtersContainer}>
          <FilterButtonWithCounter
            filterCounter={numOfActiveAmrFilters}
            onFilterToggle={() => setHideFilters(!hideFilters)}
            showFilters={!hideFilters}
          />
          <div className={hideFilters && cs.hideFilters}>
            <div className={cs.filters}>
              <h2 className={cs.sectionTitle}>Filters</h2>
              <AmrThresholdFilters
                updateThresholdFilters={updateThresholdFilters}
              />
            </div>
          </div>
        </div>
      }
      anchorPosition="left"
      customDrawerWidth={drawerWidth}
    />
  );
};
