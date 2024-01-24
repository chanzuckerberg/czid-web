import { get } from "lodash/fp";

export const triggersCondtionalFieldMetricList = (
  conditionalField,
  selectedFields,
) => {
  const thresholdMetrics = selectedFields["filter_by"].map(obj =>
    obj["metric"].replace("_", "."),
  ); // Heatmap metrics use underscore as separator, bulk downloads use periods
  return (
    thresholdMetrics.filter(metric =>
      conditionalField.triggerValues.includes(metric),
    ).length > 0
  );
};

export const triggersConditionalField = (conditionalField, selectedFields) =>
  conditionalField.dependentFields
    .map(dependentField =>
      selectedFields &&
      selectedFields["filter_by"] &&
      dependentField === "filter_by"
        ? triggersCondtionalFieldMetricList(conditionalField, selectedFields)
        : conditionalField.triggerValues.includes(
            get(dependentField, selectedFields),
          ),
    )
    .some(Boolean);
