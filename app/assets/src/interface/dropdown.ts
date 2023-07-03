export type MetricText = string;
export type ThresholdFilterOperator = ">=" | "<=";

export interface MetricOption {
  text: MetricText;
  value: string;
}

export interface ThresholdFilterData {
  metric: string;
  value: string;
  operator: ThresholdFilterOperator;
  metricDisplay: string;
}

// For use with SDS Dropdown, DropdownMenu and Menu Components
export interface SDSFormattedDropdownOption {
  name: string;
  section?: string;
}
