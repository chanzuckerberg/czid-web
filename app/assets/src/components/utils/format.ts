export const formatPercent = (number: number) =>
  `${(100 * number).toFixed(1)}%`;

export const limitToRange = (number: number, min: number, max: number) =>
  Math.min(max, Math.max(min, number));

// Converts file sizes to readable format.
// Example: 1234 to 1.2 kb
export const formatFileSize = (
  bytes: number,
  unitIndex = ["B", "kB", "MB", "GB", "TB", "PB"],
  decimals?: number,
) => formatWithUnits(bytes, 1024, unitIndex, decimals);

export const formatWithUnits = (
  number: number,
  unitFactor: number,
  units: string[],
  decimals = 1,
) => {
  let unitIndex = 0;

  while (Math.abs(number) >= unitFactor && unitIndex < units.length - 1) {
    number /= unitFactor;
    unitIndex++;
  }

  return `${unitIndex > 0 ? number.toFixed(decimals) : number} ${
    units[unitIndex]
  }`;
};
