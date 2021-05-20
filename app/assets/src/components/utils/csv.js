import { head, isEmpty, isNumber, isString, tail } from "lodash/fp";
import Papa from "papaparse";
import { logError } from "./logUtil";

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
  if (!isEmpty(row)) {
    return row.map(val => {
      if (isNumber(val)) {
        return val;
      } else if (isString(val)) {
        return escapeFormulae(val);
      } else {
        logError({
          message: "CSV Util: Invalid sanitization of value",
          details: { val, row },
        });
      }
    });
  } else {
    logError({
      message: "CSV Util: Empty row provided into sanitizeCSVRow()",
    });
  }
};

// "headers" (Array containing 1 comma delimited string) are the csv table headers and looks like:
//     ["taxId,taxLevel,genus_tax_id,name,common_name,categ…_mean_mass_normalized,nr.bg_stdev_mass_normalized"]
// "rows" (Array containing N Arrays each of which contains 1 comma delimited string) are the csv table rows and looks like:
//     [
//        ["694002,"genus",694002,"Betacoronavirus","","viruse…187294,99.9763,4399.69,0.00284868,"-","-","-","-""],
//        ["694009,"species",694002,"Severe acute respiratory …98.5,187350,1,187294,100,4399.7,0,"-","-","-","-""],
//     ]
export const createCSVObjectURL = (headers, rows) => {
  const csvData = [headers].concat(rows);
  const dataString = csvData.join("\n");
  const dataBlob = new Blob([dataString], { type: "text/csv" });
  return URL.createObjectURL(dataBlob);
};
