function ThresholdMap(options) {
  this.options = options;
}

ThresholdMap.isThresholdValid = function(threshold) {
  if (
    threshold.hasOwnProperty("metric") &&
    threshold.hasOwnProperty("operator") &&
    threshold.hasOwnProperty("value")
  ) {
    return (
      threshold.metric.length > 0 &&
      threshold.operator.length > 0 &&
      (threshold.value != "" && !isNaN(threshold.value))
    );
  }
  return false;
};

ThresholdMap.getSavedThresholdFilters = function() {
  const activeThresholds = window.localStorage.getItem("activeThresholds");
  return activeThresholds ? JSON.parse(activeThresholds) : [];
};

ThresholdMap.saveThresholdFilters = function(thresholds) {
  const activeThresholds = thresholds.filter(threshold => {
    return ThresholdMap.isThresholdValid(threshold);
  });
  window.localStorage.setItem(
    "activeThresholds",
    JSON.stringify(activeThresholds)
  );
};

ThresholdMap.taxonPassThresholdFilter = function(taxon, rules) {
  if (Object.keys(taxon).length <= 0) {
    return false;
  }

  for (let i = 0; i < rules.length; i += 1) {
    let rule = rules[i];
    if (ThresholdMap.isThresholdValid(rule)) {
      let { metric, operator, value } = rule;
      let threshold = parseFloat(value);
      const [fieldType, fieldTitle] = metric.split("_");
      const taxonValue = (taxon[fieldType] || {})[fieldTitle];
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

export default ThresholdMap;
