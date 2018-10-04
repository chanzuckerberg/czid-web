const metricNames = {
  "NT.aggregatescore": "Score",
  "NT.rpm": "NT rPM",
  "NT.r": "NT r (reads)",
  "NT.zscore": "NT z-score",
  "NT.maxzscore": "Max z-score",
  "NT.percentidentity": "NT %id",
  "NT.neglogevalue": "NT log(1/e)",
  "NR.rpm": "NR rPM",
  "NR.r": "NR r (reads)",
  "NR.zscore": "NR z-score",
  "NR.percentidentity": "NR %id",
  "NR.neglogevalue": "NR log(1/e)"
};
const metricNamesAugmented = {};
for (var m in metricNames) {
  metricNamesAugmented[m] = metricNames[m];
  metricNamesAugmented[m.replace(".", "_")] = metricNames[m];
  metricNamesAugmented[m.replace(".", "_").toLowerCase()] = metricNames[m];
}
metricNamesAugmented["aggregatescore"] =
  metricNamesAugmented["NT.aggregatescore"];
export const METRIC_NAMES = metricNamesAugmented;

export const THRESHOLD_METRICS = [
  "NT_aggregatescore",
  "NT_zscore",
  "NT_rpm",
  "NT_r",
  "NT_percentidentity",
  "NT_neglogevalue",
  "NR_zscore",
  "NR_r",
  "NR_rpm",
  "NR_percentidentity",
  "NR_neglogevalue"
];

export const TREE_METRICS = [
  "aggregatescore",
  "nt_r",
  "nt_rpm",
  "nt_zscore",
  "nr_r",
  "nr_rpm",
  "nr_zscore"
];

export function MetricTextAndValue(desiredMetrics) {
  let result = desiredMetrics.map(metric => {
    return { text: METRIC_NAMES[metric], value: metric };
  });
  return result;
}
