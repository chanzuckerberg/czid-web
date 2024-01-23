import React from "react";

type FilteredCountProps = {
  workflowDisplayText: string;
  count: number | { numerator: number; denominator: number };
};

export const FilteredCount = ({
  count,
  workflowDisplayText,
}: FilteredCountProps) => {
  return (
    <>
      {typeof count === "number"
        ? count
        : `${count.numerator} out of ${count.denominator}`}{" "}
      {workflowDisplayText}
    </>
  );
};
