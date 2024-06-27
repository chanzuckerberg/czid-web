import { BACKGROUND_METRICS } from "./constants";

export const throttle = (callbackFn, limit: number) => {
  let wait = false;
  return function () {
    if (!wait) {
      callbackFn.call();
      wait = true;
      setTimeout(function () {
        wait = false;
      }, limit);
    }
  };
};

export const getTruncatedLabel = (label: string) => {
  return label.length > 20
    ? `${label.slice(0, 9)}...${label.slice(-7)}`
    : label;
};

// metrics from the backend can be of the form "NT.zscore" or "NT_zscore"
export const metricIsZscore = (metric: string) => {
  return (
    BACKGROUND_METRICS.map(m => m.thresholdMetricValue).includes(metric) ||
    BACKGROUND_METRICS.map(m => m.value).includes(metric)
  );
};
