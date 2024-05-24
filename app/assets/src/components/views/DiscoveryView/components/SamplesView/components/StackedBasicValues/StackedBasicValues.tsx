import { isEmpty } from "lodash/fp";
import React from "react";
import cs from "./stacked_basic_values.scss";

interface StackedBasicValuesProps {
  cellData: string[] | number[];
}

export const StackedBasicValues = ({
  cellData: basicValues,
}: StackedBasicValuesProps) => {
  if (isEmpty(basicValues)) return;

  if (basicValues.length === 1) {
    return basicValues[0];
  } else {
    return (
      <div className={cs.stackedValues}>
        <div className={cs.stackedValue}>{basicValues[0]}</div>
        <div className={cs.horizontalSeparator} />
        <div className={cs.stackedValue}>{basicValues[1]}</div>
      </div>
    );
  }
};
