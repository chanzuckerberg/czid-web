import fs from "fs";

/**
 * Convenience function that returns either value if set or the supplied default value
 * This is handy in generating test data, where the user may or may provide
 * default value. The caller provides a randomly generated value to
 * be set if there is no default.
 * @param value randomly generated value
 * @param defaultValue optional default value supplied by the user
 * @returns value or defaultValue
 */
export function getValueOrDefault<T>(value: T, defaultValue: T): T {
  return value !== undefined ? value : defaultValue;
}

/**
 * Convenience function that returns either attribute value of
 * an object if object and attribute are both not null.
 * Otherwise, it will return a supplied value.
 * This is handy in generating test data, where the user may or may provide
 * default value. The caller provides a randomly generated value to
 * be set if there is no default.
 * @param obj
 * @param attribute
 * @param defaultValue
 * @returns object attribute value or supplied value
 */
export function getAttributeOrDefault<T>(
  obj: any,
  attribute: string,
  defaultValue: T,
): T {
  if (obj === undefined) {
    return defaultValue;
  }
  return obj[attribute] !== undefined ? obj[attribute] : defaultValue;
}

/**
 * Random number generator to generate a number with a range
 * so it can used for example for IDs
 * @param min:number lower bounder
 * @param max:number upper limit
 * @returns interger
 */
export function getRandomNumber(min?: number, max?: number): number {
  const lowerLimit = min !== undefined ? min : 1;
  const upperLimit = max !== undefined ? max : 99999;
  return Math.floor(Math.random() * upperLimit) + lowerLimit;
}

/**
 * Reads JSON fixture file from the fixture directory.
 * @param fileName
 * @returns JSON object
 */
export function getFixture(fileName: string) {
  const locations = fs.readFileSync(`fixtures/${fileName}.json`);
  return JSON.parse(locations.toString());
}

/**
 * Random alphanumeric string generator for data fields that are
 * free style string, for example Sample name.
 * @param stringLength length of string
 * @param includeLowerCase: boolean whether to include lower cases
 * @param includeNumbers: boolean whether to include numbers
 * @returns string
 */
export function getAlphaNumericString(
  stringLength: number,
  includeLowerCase = true,
  includeNumbers = true,
): string {
  let charSet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  if (includeLowerCase) {
    charSet += "abcdefghijklmnopqrstuvwxyz";
  }
  if (includeNumbers) {
    charSet += "0123456789";
  }
  let randomString = "";
  for (let i = 0; i < stringLength; i++) {
    const randomPos = Math.floor(Math.random() * charSet.length);
    randomString += charSet.substring(randomPos, randomPos + 1);
  }
  return randomString;
}

/*
  This helper method generates a date in the past.
  @param {number} howRecent: how recent the date should be, defaults to 10, meaning the date can be 1 - 10 days in the past
  @param {string} refDate: reference date to use, especially useful for sequencing date that needs to be older that collection date
  */
export function getAFullDateInThePast(
  min = 0,
  max = 10,
  isoString = false,
  refDate?: string,
): string {
  // default to current date as a refence date
  const fromDate = refDate !== undefined ? new Date(refDate) : new Date();
  let d = fromDate;
  const delta = max - min;
  do {
    d = fromDate;
    const randomNumber = Math.floor(Math.random() * delta);
    d.setDate(d.getDate() - randomNumber);
  } while (d.getTime() < fromDate.getTime());
  if (isoString) {
    return d.toISOString();
  } else {
    return d.toISOString().substring(0, 10);
  }
}

/**
 * This function serves specific purpose for generating date in the format
 * YYYY-MM for sample collection dates
 * @param minYear - earliest year to start from, upper limit is current year
 * @returns yyyy-mm
 */
export function getYearMonthInThePast(minYear = 5): string {
  const today = new Date();
  const d = today;
  const randomNumber = Math.floor(Math.random() * minYear);
  d.setFullYear(d.getFullYear() - randomNumber);
  return d.toISOString().substring(0, 7);
}
