import React, { useContext } from "react";
import ThresholdFilterSDS from "~/components/common/filters/ThresholdFilterSDS";
import { ThresholdFilterData } from "~/interface/dropdown";
import {
  AmrContext,
  AmrContextActionType,
  createAmrContextAction,
} from "../../../../amrContext/reducer";
import { ColumnId, COLUMN_ID_TO_NAME } from "../../../../constants";
import { thresholdFilterOptionColumnIds } from "../../constants";
import { FiltersType, FilterType, TypeFilterType } from "../../types";
import { getAmrColumnTransform } from "../../utils";

interface AmrThresholdFiltersProps {
  hideFilters: boolean;
}

export const AmrThresholdFilters = ({
  hideFilters,
}: AmrThresholdFiltersProps) => {
  const { amrContextState, amrContextDispatch } = useContext(AmrContext);

  const activeFilters: FilterType[] = Object.values(
    amrContextState?.activeFilters || {},
  );
  const activeThresholdFilters: ThresholdFilterData[] = activeFilters.reduce(
    (arr, filter) => {
      if (filter.type === TypeFilterType.THRESHOLD) {
        if (!filter.params.thresholdFilters) return arr;
        arr.push(...filter.params.thresholdFilters);
      }
      return arr;
    },
    [] as ThresholdFilterData[],
  );

  const dispatchUpdateThresholdFilters = (
    activeThresholdFilters: FiltersType,
  ) => {
    amrContextDispatch(
      createAmrContextAction(
        AmrContextActionType.UPDATE_ACTIVE_THRESHOLD_FILTERS,
        activeThresholdFilters,
      ),
    );
  };

  const handleApply = (filterData: ThresholdFilterData[]) => {
    // separate filters by columnId, then update the param thresholdFilters array
    const emptyActiveFilters = thresholdFilterOptionColumnIds.reduce(
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

    const activeFilters = filterData.reduce((obj, item) => {
      const columnId = item.metric as ColumnId;
      obj[columnId].params.thresholdFilters.push(item);
      return obj;
    }, emptyActiveFilters);

    dispatchUpdateThresholdFilters(activeFilters);
  };

  return hideFilters ? null : (
    <ThresholdFilterSDS
      selectedThresholds={activeThresholdFilters}
      onApply={handleApply}
      disabled={hideFilters}
      metricOptions={thresholdFilterOptionColumnIds.map(columnId => ({
        text: COLUMN_ID_TO_NAME.get(columnId),
        value: columnId,
      }))}
    />
  );
};
