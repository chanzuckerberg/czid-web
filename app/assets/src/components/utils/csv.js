import { head, tail } from "lodash/fp";
import Papa from "papaparse";

// Assumes that the CSV has headers.
export const parseCSVBlob = blob => {
  const csvData = Papa.parse(blob, {
    skipEmptyLines: true
  }).data;

  return {
    headers: head(csvData),
    rows: tail(csvData)
  };
};
