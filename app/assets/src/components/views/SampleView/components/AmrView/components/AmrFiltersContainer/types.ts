import { ThresholdFilterData } from "~/interface/dropdown";
import { ColumnId } from "../../constants";

export enum TypeFilterType {
  THRESHOLD = "threshold",
  SINGLE = "single",
  MULTIPLE = "multiple",
}

export interface FilterParamsType {
  thresholdFilters?: ThresholdFilterData[];
  selected?: string;
  multiSelected?: string[]; // for drug class filter
}
export interface FilterType {
  key: ColumnId;
  params: FilterParamsType;
  transform?: (d: any) => any;
  type: TypeFilterType;
}

export type FiltersType = {
  [filterKey in ColumnId]?: FilterType;
};
