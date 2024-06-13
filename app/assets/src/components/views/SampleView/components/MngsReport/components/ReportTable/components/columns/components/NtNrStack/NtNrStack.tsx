import { cx } from "@emotion/css";
import React from "react";
import cs from "~/components/views/SampleView/components/MngsReport/components/ReportTable/report_table.scss";
import { DBType } from "~/interface/sampleView";

interface NtNrStackProps {
  cellData: Array<string | number | JSX.Element>;
  dbType: DBType;
  onClick?: Array<(x: string) => void>;
}

export const NtNrStack = ({ cellData, dbType, onClick }: NtNrStackProps) => {
  // onClick is only defined when using NtNrStack in the NtNrSelector component
  if (onClick && cellData) {
    return (
      <div className={cs.stack}>
        <button
          className={cx("noStyleButton", cs.stackElement)}
          onClick={() => onClick[0]("nt")}
        >
          {cellData[0]}
        </button>
        <button
          className={cx("noStyleButton", cs.stackElement)}
          onClick={() => onClick[1]("nr")}
        >
          {cellData[1]}
        </button>
      </div>
    );
  }
  return (
    <div className={cs.stack}>
      <div className={cx(cs.stackElement, dbType === "nt" || cs.lowlightValue)}>
        {cellData ? cellData[0] : "-"}
      </div>
      <div className={cx(cs.stackElement, dbType === "nr" || cs.lowlightValue)}>
        {cellData ? cellData[1] : "-"}
      </div>
    </div>
  );
};
