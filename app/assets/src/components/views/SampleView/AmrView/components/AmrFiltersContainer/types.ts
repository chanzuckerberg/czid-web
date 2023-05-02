import { ColumnId } from "../../constants";

export enum TypeFilterType {
  THRESHOLD = "threshold",
  SINGLE = "single",
  MULTIPLE = "multiple",
}

export interface FilterParamsType {
  lowerBound?: number;
  upperBound?: number;
  selected?: string;
  multiSelected?: string[]; // for drug class filter
}
export interface FilterType {
  key: string;
  params: FilterParamsType;
  transform?: (d: any) => any;
  type: TypeFilterType;
}

export type FiltersType = {
  [filterKey in ColumnId]?: FilterType;
};

type UpdateThresholdFilterType = {
  filterKey: ColumnId;
  lowerBound?: number | undefined;
  upperBound?: number | undefined;
};

export type UpdateThresholdFiltersType = {
  [filterKey in ColumnId]?: UpdateThresholdFilterType;
};
