import { ColumnId } from "../../constants";
import { AmrResult } from "../AmrSampleReport/types";
import { FiltersType } from "./types";

export const getAmrColumnTransform = (columnId: ColumnId) => {
  // rPM and dPM are the only columns where the lookup key is different from the columnId
  // rPM and dPM are also the only columns with number values instead of strings
  if (columnId === ColumnId.READS_PER_MILLION) {
    return (d: AmrResult) => d.rpm;
  } else if (columnId === ColumnId.READ_DEPTH_PER_MILLION) {
    return (d: AmrResult) => d.dpm;
  } else {
    return (d: AmrResult) => {
      const columnData = d[columnId];
      return columnData ? parseFloat(columnData) : null;
    };
  }
};

export const countActiveFilters = (filters: FiltersType): number => {
  if (!filters) return 0;
  return Object.values(filters).reduce((count, filter) => {
    const thresholdFilters = filter?.params?.thresholdFilters;
    const selected = filter?.params?.selected;
    const multiSelected = filter?.params?.multiSelected;
    switch (filter.type) {
      case "threshold":
        return count + (thresholdFilters?.length || 0);
      case "single":
        return count + (selected ? 1 : 0);
      case "multiple":
        return count + (multiSelected?.length || 0);
      default:
        return count;
    }
  }, 0);
};
