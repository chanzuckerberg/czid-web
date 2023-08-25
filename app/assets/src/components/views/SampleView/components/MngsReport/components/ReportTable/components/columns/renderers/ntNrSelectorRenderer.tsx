import React from "react";
import { DBType, HeaderRendererType } from "~/interface/sampleView";
import { NtNrSelector } from "../components/NtNrSelector";

// The output of this function is passed to headerRenderer which takes a function of type HeaderRendererType
// This returns a function that returns a component, this does not return the
// component directly
export const getNtNrSelectorRenderer: (
  dbType: DBType,
  handleNtNrChange: (selectedDbType: "nr" | "nt") => void,
) => HeaderRendererType = (dbType, handleNtNrChange) =>
  function ntNrSelectorRenderer() {
    return <NtNrSelector dbType={dbType} handleNtNrChange={handleNtNrChange} />;
  };
