export type MetricText = string;
export type ThresholdFilterOperator = ">=" | "<=";

export interface BackgroundOption {
  text: string;
  value: number;
  mass_normalized: boolean
}

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
