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
  return (
    <div className={cs.stack}>
      <div
        className={cx(cs.stackElement, dbType === "nt" || cs.lowlightValue)}
        // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2322
        onClick={onClick ? () => onClick[0]("nt") : null}
      >
        {cellData ? cellData[0] : "-"}
      </div>
      <div
        className={cx(cs.stackElement, dbType === "nr" || cs.lowlightValue)}
        // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2322
        onClick={onClick ? () => onClick[1]("nr") : null}
      >
        {cellData ? cellData[1] : "-"}
      </div>
    </div>
  );
};
