import { ThresholdFilterData } from "~/interface/dropdown";

export type DropdownOptionType = {
  text: string;
  value: string;
};

export type MetricsOptionType = DropdownOptionType;

export type BackgroundOptionType = {
  text: string;
  value: string | number;
  mass_normalized: boolean;
};

export type SelectedFieldValueType =
  | string
  | number
  | boolean
  | ThresholdFilterData[]
  | undefined;

export type SelectedFieldType = Record<string, SelectedFieldValueType>;

export type SelectedFieldsType = Record<string, SelectedFieldType>;
