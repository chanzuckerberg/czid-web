export const formatPercent = number => `${(100 * number).toFixed(1)}%`;

export const limitToRange = (number, min, max) =>
  Math.min(max, Math.max(min, number));

// Converts file sizes to readable format.
// Example: 1234 to 1.2 kb
export const formatFileSize = bytes =>
  formatWithUnits(bytes, 1024, ["B", "kB", "MB", "GB", "TB", "PB"]);

export const formatWithUnits = (number, unitFactor, units) => {
  let unitIndex = 0;

  while (Math.abs(number) >= unitFactor && unitIndex < units.length - 1) {
    number /= unitFactor;
    unitIndex++;
  }

  return `${unitIndex > 0 ? number.toFixed(1) : number} ${units[unitIndex]}`;
};

export const formatSentenceCase = string => {
  if (!/^\w/.test(string)) {
    return string;
  }
  const upperCaseLetter = /^\w/.exec(string)[0].toUpperCase();
  return string.replace(/^\w/, upperCaseLetter);
};
