import React from "react";
import TableRenderers from "~/components/views/discovery/TableRenderers";
import { CellRendererType, DBType } from "~/interface/sampleView";
import { NtNrStack } from "../components/NtNrStack";

// The output of this function is passed to cellRenderer which takes a function of type CellRendererType
// This returns a function that returns a component, this does not return the
// component directly
export const getBase10ExponentRenderer: (
  dbType: DBType,
) => CellRendererType = dbType =>
  function base10ExponentRenderer({ cellData }: { cellData: Array<number> }) {
    if (!cellData.length) return "-";

    return (
      <NtNrStack
        cellData={cellData.map(val => TableRenderers.format10BaseExponent(val))}
        dbType={dbType}
      />
    );
  };
