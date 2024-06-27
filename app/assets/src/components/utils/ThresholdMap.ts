import { getTaxonMetric } from "~/components/utils/taxon";

function ThresholdMap(options) {
  this.options = options;
}

ThresholdMap.isThresholdValid = function (threshold: ThresholdConditions) {
  if (threshold.metric && threshold.operator && threshold.value) {
    return (
      threshold.metric.length > 0 &&
      threshold.operator.length > 0 &&
      threshold.value !== "" &&
      !isNaN(Number(threshold.value))
    );
  }
  return false;
};

ThresholdMap.getSavedThresholdFilters = function (): ThresholdConditions[] {
  const activeThresholds = window.localStorage.getItem("activeThresholds");
  return activeThresholds ? JSON.parse(activeThresholds) : [];
};

ThresholdMap.saveThresholdFilters = function (
  thresholds: ThresholdConditions[],
) {
  const activeThresholds = thresholds.filter(threshold => {
    return ThresholdMap.isThresholdValid(threshold);
  });
  window.localStorage.setItem(
    "activeThresholds",
    JSON.stringify(activeThresholds),
  );
};

ThresholdMap.taxonPassThresholdFilter = function (
  taxon: object,
  rules: ThresholdConditions[],
) {
  if (Object.keys(taxon).length <= 0) {
    return false;
  }

  for (let i = 0; i < rules.length; i += 1) {
    const rule = rules[i];
    if (ThresholdMap.isThresholdValid(rule)) {
      const { metric, operator, value } = rule;
      const threshold = parseFloat(value);
      const [fieldType, fieldTitle] = metric.split("_");
      const taxonValue = getTaxonMetric(taxon, fieldType, fieldTitle);
      switch (operator) {
        case ">=":
          if (taxonValue < threshold) {
            return false;
          }
          break;
        case "<=":
          if (taxonValue > threshold) {
            return false;
          }
          break;
        default:
          // Invalid threshold: ignore - should never be here
          // TODO: log to server once we have that ability
          break;
      }
    }
  }
  return true;
};

export interface ThresholdConditions {
  metric: string;
  operator: ">=" | "<=";
  value: string;
  metricDisplay: string;
}

export interface ThresholdForAPI {
  metric: string;
  count_type: string;
  operator: ">=" | "<=";
  value: string;
}
export default ThresholdMap;
