import React from "react";
import BasicPopup from "~/components/BasicPopup";
import { DBType } from "~/interface/sampleView";
import { NtNrStack } from "../NtNrStack";

interface NtNrSelectorProps {
  dbType: DBType;
  handleNtNrChange: (selectedDbType: "nr" | "nt") => void;
}

export const NtNrSelector = ({
  dbType,
  handleNtNrChange,
}: NtNrSelectorProps) => {
  const selector = (
    <div>
      <NtNrStack
        cellData={["NT", "NR"]}
        dbType={dbType}
        onClick={[() => handleNtNrChange("nt"), () => handleNtNrChange("nr")]}
      />
    </div>
  );

  return (
    <BasicPopup
      trigger={selector}
      position="top right"
      content="Switch count type"
      inverted
      basic={false}
      size="small"
    />
  );
};
