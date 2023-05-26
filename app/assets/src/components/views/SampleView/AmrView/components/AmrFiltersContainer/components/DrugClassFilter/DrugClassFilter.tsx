import { ComplexFilter, DefaultDropdownMenuOption } from "czifui";
import React from "react";
import { activeAmrFiltersVar } from "~/cache/initialCache";
import { ColumnId } from "../../../../constants";
import { UpdateMultipleFilterType } from "../../types";
import cs from "./drug_class_filter.scss";

interface DrugClassFilterProps {
  drugClassOptions: { name: string }[];
  onDrugClassChange: (filtersData: UpdateMultipleFilterType) => void;
  hideFilters?: boolean;
}

export const DrugClassFilter = ({
  drugClassOptions,
  onDrugClassChange,
  hideFilters,
}: DrugClassFilterProps) => {
  const handleDrugClassChange = (
    selectedDrugClassOptions: DefaultDropdownMenuOption[],
  ) => {
    const selectedDrugClasses = selectedDrugClassOptions.map(
      ({ name }) => name,
    );

    onDrugClassChange({
      filterKey: ColumnId.DRUG_CLASS,
      multiSelected: selectedDrugClasses,
    });

    activeAmrFiltersVar({
      ...activeAmrFiltersVar(),
      drugClassFilters: selectedDrugClasses,
    });
  };

  return (
    !hideFilters && (
      <ComplexFilter
        options={drugClassOptions}
        onChange={selectedDrugClassOptions =>
          handleDrugClassChange(selectedDrugClassOptions)
        }
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore There's a PR to switch from czifui to the new sds package @czi-sds/components.
        // Once that switch is made, this type error will be fixed.
        label={<div className={cs.label}>Drug Class</div>}
        multiple
        isTriggerChangeOnOptionClick
        InputDropdownProps={{ sdsStyle: "minimal" }}
        DropdownMenuProps={{
          title: "Select Drug Class",
        }}
        className={cs.drugClassFilter}
      />
    )
  );
};
