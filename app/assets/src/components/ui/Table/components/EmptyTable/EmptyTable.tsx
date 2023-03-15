import { cx } from "@emotion/css";
import React from "react";
import cs from "./empty_table.scss";

interface EmptyTableProps {
  numOfColumns: number;
}

const EmptyState = ({ numOfColumns }: EmptyTableProps): JSX.Element => {
  return (
    <div className={cs.container}>
      <EmptyCells numOfColumns={numOfColumns} />
    </div>
  );
};

function EmptyCells({ numOfColumns = 0 }: EmptyTableProps): JSX.Element {
  return (
    <>
      {Array.from(Array(numOfColumns)).map((_, index) => {
        return (
          <div className={cs.cellContainer} key={index} data-test-id="loading-cell">
            {index ? <div className={cx(cs.loadingBackgroundAnimation, cs.cell)} /> : <FirstColumn />}
          </div>
        );
      })}
    </>
  );
}

function FirstColumn() {
  return (
    <div className={cs.column}>
      <div className={cx(cs.loadingBackgroundAnimation, cs.square)} />
      <div className={cs.bars}>
        <div className={cx(cs.loadingBackgroundAnimation, cs.long)} />
        <div className={cx(cs.loadingBackgroundAnimation, cs.short)} />
      </div>
    </div>
  );
}

function EmptyTable({ numOfColumns }: EmptyTableProps): JSX.Element {
  return (
    <>
      {Array(10)
        .fill(0)
        .map((_, i) => (
          <div className={cs.wrapper} key={i}>
            <EmptyState numOfColumns={numOfColumns} />
          </div>
        ))}
    </>
  );
}

export { EmptyTable };