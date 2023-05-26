import { useReactiveVar } from "@apollo/client";
import { cx } from "@emotion/css";
import { filter, forEach, map, split, trim } from "lodash/fp";
import React, { useContext, useEffect, useState } from "react";
import { activeAmrFiltersVar, amrDrugClassesVar } from "~/cache/initialCache";
import { UserContext } from "~/components/common/UserContext";
import { FilterButtonWithCounter } from "~/components/ui/controls/buttons/FilterButtonWithCounter";
import { AMR_V3_FEATURE } from "~/components/utils/features";
import { ColumnId } from "../../constants";
import { AmrResult } from "../AmrSampleReport/types";
import cs from "./amr_filters_container.scss";
import { AmrThresholdFilters } from "./components/AmrThresholdFilters";
import { DrugClassFilter } from "./components/DrugClassFilter";
import { thresholdFilterOptionColumnIds } from "./constants";
import {
  FilterParamsType,
  FiltersType,
  FilterType,
  TypeFilterType,
  UpdateMultipleFilterType,
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
const DATA_FILTER_INIT: FiltersType = {
  ...THRESHOLD_FILTER_INIT,
  ...DRUG_CLASS_FILTER_INIT,
};

const applyFilter = (data: AmrResult[], dataFilter: FilterType) => {
  if (!data) return [];

  const { key, params, transform, type } = dataFilter;
  if (!key || !params || !type) return data;
  const { lowerBound, upperBound, selected, multiSelected = [] } = params;

  switch (type) {
    case TypeFilterType.THRESHOLD:
      // lowerBound (or upperBound) === 0 is a valid value, so we need to check if it is undefined rather than falsy
      if (lowerBound === undefined && upperBound === undefined) return data;

      return filter(d => {
        const value = transform ? transform(d) : d;

        // Check each row of the data to see if it passes this threshold filter
        const doesPassFilterCheckLowerBound =
          lowerBound === undefined || value >= lowerBound;
        const doesPassFilterCheckUpperBound =
          upperBound === undefined || value <= upperBound;

        return doesPassFilterCheckLowerBound && doesPassFilterCheckUpperBound;
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
  const { allowedFeatures } = useContext(UserContext) || {};
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

  const updateDrugClassFilter = (filtersData: UpdateMultipleFilterType) => {
    const { multiSelected } = filtersData;

    updateDataFilters([
      {
        filterKey: ColumnId.DRUG_CLASS,
        params: {
          multiSelected,
        },
      },
    ]);
  };

  const activeAmrFilters = useReactiveVar(activeAmrFiltersVar);
  const numOfActiveAmrFilters = countActiveFilters(activeAmrFilters);
  const drugClassList = useReactiveVar(amrDrugClassesVar);

  return (
    <div className={cs.filtersContainer}>
      <div
        className={cx(
          cs.filtersContent,
          hideFilters ? cs.filtersContentClosed : cs.filtersContentOpen,
        )}
      >
        <FilterButtonWithCounter
          filterCounter={numOfActiveAmrFilters}
          onFilterToggle={() => setHideFilters(!hideFilters)}
          showFilters={!hideFilters}
          popupPosition="top left"
        />
        <div className={hideFilters && cs.hideFilters}>
          <div className={cs.filters}>
            <h2 className={cs.sectionTitle}>Filters</h2>
            <AmrThresholdFilters
              hideFilters={hideFilters}
              updateThresholdFilters={updateThresholdFilters}
            />
            {allowedFeatures.includes(AMR_V3_FEATURE) && (
              <DrugClassFilter
                hideFilters={hideFilters}
                drugClassOptions={
                  drugClassList?.map(drugClass => ({ name: drugClass })) ?? []
                }
                onDrugClassChange={updateDrugClassFilter}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
