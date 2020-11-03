import { head, isNumber, isString, tail } from "lodash/fp";
import { logError } from "./logUtil";
import Papa from "papaparse";

// Assumes that the CSV has headers.
export const parseCSVBlob = blob => {
  const csvData = Papa.parse(blob, {
    skipEmptyLines: true,
  }).data;

  return {
    headers: head(csvData),
    rows: tail(csvData),
  };
};

const escapeFormulae = datum => {
  // Defend against injection attacks, because Excel and LibreOffice will automatically parse =, +, -, or @ such cells as formulae.
  // Formulae Injection Attacks: https://www.contextis.com/en/blog/comma-separated-vulnerabilities

  // Replace only replaces the first occurence. To replace all +, -, =, @, we use the global g flag for RegExp.
  return datum.replace(/^[=+\-@]/g, "");
};

export const sanitizeCSVRow = row => {
  return row.map(val => {
    if (isNumber(val)) {
      return val;
    } else if (isString(val)) {
      return escapeFormulae(val);
    } else {
      logError({
        message: "CSV Util: Invalid sanitation of value",
        details: { val, row },
      });
    }
  });
};

export const createCSVObjectURL = (headers, rows) => {
  const csvData = [headers].concat(rows);
  const dataString = csvData.join("\n");
  const dataBlob = new Blob([dataString], { type: "text/csv" });
  return URL.createObjectURL(dataBlob);
};
