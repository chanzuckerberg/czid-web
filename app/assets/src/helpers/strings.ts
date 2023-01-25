import { isNil } from "lodash/fp";

/**
  @function numberWithCommas
  @param {Number} x
  @return {String} comma separated numbers
*/
export function numberWithCommas(x) {
  if (isNil(x)) return x;

  x = x.toString();
  const pattern = /(-?\d+)(\d{3})/;
  while (pattern.test(x)) {
    x = x.replace(pattern, "$1,$2");
  }
  return x;
}

/**
 * @param  {String}
 * @return {String}
 *
 * > humanize('taxon_tree')
 * "Taxon Tree"
 */
export function humanize(key: string): string {
  return key
    .split("_")
    .map(str => str.charAt(0).toUpperCase() + str.slice(1))
    .join(" ");
}

// Split a string into multiple lines based on maxChars. Only split on white-space.
export function splitIntoMultipleLines(string: string, maxChars: number) {
  const words = string.split(" ");

  const lines = [];
  let curLine = "";

  words.forEach(word => {
    // If adding the next word overflows the line, start a new line.
    if (curLine.length + 1 + word.length > maxChars && curLine.length > 0) {
      lines.push(curLine);
      curLine = "";
    }

    // If not the first word in the line, add a space first.
    if (curLine.length > 0) {
      curLine += " ";
    }
    curLine += word;
  });

  // Add the last line if it's non-empty.
  if (curLine.length > 0) {
    lines.push(curLine);
  }

  return lines;
}

/**
  @function numberWithPlusOrMinus
  @param {Number} x
  @param {Number} y
  @return {String|Null} comma separated numbers with error, null if either is not a number
*/
export function numberWithPlusOrMinus(x: number, y: number): string | null {
  if (typeof x !== "number" || typeof y !== "number") {
    return null;
  }
  return `${numberWithCommas(Math.round(x))}±${numberWithCommas(
    Math.round(y),
  )}`;
}

// Convert a value into a string with at most 4 characters, 3 for the number and one for
// either thousands ("K") or millions ("M")
export function numberWithSiPrefix(value: number) {
  let formatted = "NaN";
  if (value < 1000) {
    formatted = value.toString();
  } else if (value < 1000000) {
    formatted = (value / 1000).toString().concat("K");
  } else {
    formatted = (value / 1000000).toString().concat("M");
  }
  return formatted;
}

/**
 * @param {String|Number} value
 * @returns {String}
 */
export function numberWithPercent(value: string | number): string {
  return `${value}%`;
}

const specialCharacters = /[^A-Za-z0-9_\- ]/g;

export function replaceSpecialCharacters(value: string) {
  value = value.replaceAll(specialCharacters, "-");
  return value;
}

export function testForSpecialCharacters(value: string) {
  return specialCharacters.test(value);
}
