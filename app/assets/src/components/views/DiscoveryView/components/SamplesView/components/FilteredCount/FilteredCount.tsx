import React from "react";

type FilteredCountProps = {
  workflowDisplayText: string;
  count:
    | number
    | string
    | { numerator: number | string; denominator: number | string };
};

export const FilteredCount = ({
  count,
  workflowDisplayText,
}: FilteredCountProps) => {
  return (
    <>
      {typeof count === "object"
        ? `${count.numerator} out of ${count.denominator}`
        : count}{" "}
      {workflowDisplayText}
    </>
  );
};
