import { ComplexFilter, DefaultDropdownMenuOption } from "czifui";
import React from "react";
import cs from "./drug_class_filter.scss";

interface DrugClassFilterProps {
  drugClassOptions: { name: string }[];
  onDrugClassChange: (drugClass: DefaultDropdownMenuOption[]) => void;
  disabled: boolean;
}

export const DrugClassFilter = ({
  drugClassOptions,
  onDrugClassChange,
  disabled,
}: DrugClassFilterProps) => {
  return (
    <ComplexFilter
      value={[]}
      options={drugClassOptions}
      onChange={onDrugClassChange}
      label="Drug Class"
      multiple
      InputDropdownProps={{ sdsStyle: "minimal", disabled }}
      DropdownMenuProps={{
        title: "Select Drug Class",
      }}
      className={cs.label}
    />
  );
};
