let metric_names = {
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
let metric_names_augmented = {};
for (var m in metric_names) {
  metric_names_augmented[m] = metric_names[m];
  metric_names_augmented[m.replace(".", "_")] = metric_names[m];
}
export const METRIC_NAMES = metric_names_augmented;
