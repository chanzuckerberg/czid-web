import React from "react";
import { CellRendererType, DBType } from "~/interface/sampleView";
import { CellValue } from "../components/CellValue";

// The output of this function is passed to cellRenderer which takes a function of type CellRendererType
// This returns a function that returns a component, this does not return the
// component directly
export const getCellValueRenderer: (
  dbType: DBType,
  decimalPlaces?: number,
) => CellRendererType = (dbType, decimalPlaces) =>
  function cellValueRenderer({ cellData }) {
    return (
      <CellValue
        cellData={cellData as number[]} // CellValue expects this to be an array. Is there a better name?
        dbType={dbType}
        decimalPlaces={decimalPlaces}
      />
    );
  };
