import { parse } from "csv-parse";


export async function parseFloatFromFormattedNumber(numberString: string) {
  return parseFloat(numberString.replace(/,/g, ""));
}

export async function parseIntFromFormattedNumber(numberString: string) {
  return parseInt(numberString.replace(/,/g, ""));
}

/**
 * Matches unique read values and returns the parsed numberic value
 * 
 * Example 
 * numberString = "2,543 unique"
 * return 2543
 * 
 * @param numberString : The string to parse the number value from
 * @returns : The parsed number value
 */
export async function parseIntFromUniqueNumber(numberString: string) {
  const basesRemainingUniqueMatch = numberString.match(/\(([0-9,]+) unique\)/);
  return parseIntFromFormattedNumber(basesRemainingUniqueMatch[1]);
}

export async function parseFloatFromPercentage(percentage: string) {
  const percentageMatch = percentage.match(/\d+\.?\d*%/);
  return parseFloat(percentageMatch[0]);
}

export function parseCSV(data: any, options: any): Promise<any[]> {
  return new Promise((resolve, reject) => {
    parse(data, options, (err, output) => {
      if (err) reject(err);
      else resolve(output);
    });
  });
}
