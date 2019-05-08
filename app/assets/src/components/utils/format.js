export const formatPercent = number => `${(100 * number).toFixed(1)}%`;

export const limitToRange = (number, min, max) =>
  Math.min(max, Math.max(min, number));
