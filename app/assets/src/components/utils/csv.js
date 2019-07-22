import { head, tail } from "lodash/fp";
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

export const createCSVObjectURL = (headers, rows) => {
  const csvData = [headers].concat(rows);
  const dataString = csvData.join("\n");
  const dataBlob = new Blob([dataString], { type: "text/csv" });
  return URL.createObjectURL(dataBlob);
};
