export const convertStringAndRoundToHundredths = (s: string): number => {
  return Math.round(parseFloat(s) * 100) / 100;
};
