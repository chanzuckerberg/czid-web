import React from "react";
import { numberWithCommas } from "~/helpers/strings";
import { DBType } from "~/interface/sampleView";
import { NtNrStack } from "../NtNrStack";

interface CellValueProps {
  cellData: Array<number>;
  dbType: DBType;
  decimalPlaces?: number;
}

export const CellValue = ({
  cellData,
  dbType,
  decimalPlaces,
}: CellValueProps) => {
  if (!cellData.length) return <>-</>;

  const hasMergedNtNrValue = cellData.length === 1;
  const mergedNtNrValue = (
    <div>
      {numberWithCommas(Number(cellData[0]).toFixed(decimalPlaces || 0))}
    </div>
  );

  return hasMergedNtNrValue ? (
    mergedNtNrValue
  ) : (
    <NtNrStack
      cellData={cellData.map(val =>
        numberWithCommas(Number(val).toFixed(decimalPlaces || 0)),
      )}
      dbType={dbType}
    />
  );
};
