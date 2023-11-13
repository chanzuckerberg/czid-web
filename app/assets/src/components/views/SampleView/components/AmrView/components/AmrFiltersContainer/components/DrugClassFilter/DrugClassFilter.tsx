import { ComplexFilter, DefaultDropdownMenuOption } from "@czi-sds/components";
import React, { useContext } from "react";
import {
  AmrContext,
  AmrContextActionType,
  createAmrContextAction,
} from "../../../../amrContext/reducer";
import { ColumnId } from "../../../../constants";
import { FilterType, TypeFilterType } from "../../types";
import cs from "./drug_class_filter.scss";

interface DrugClassFilterProps {
  hideFilters?: boolean;
}

export const DrugClassFilter = ({ hideFilters }: DrugClassFilterProps) => {
  const { amrContextState, amrContextDispatch } = useContext(AmrContext);
  const drugClasses: string[] | null = amrContextState?.drugClasses;
  const dispatchUpdateDrugClassFilters = (filterData: FilterType) => {
    amrContextDispatch(
      createAmrContextAction(
        AmrContextActionType.UPDATE_ACTIVE_DRUG_CLASS_FILTERS,
        filterData,
      ),
    );
  };

  const drugClassOptions =
    drugClasses?.sort().map(drugClass => ({ name: drugClass })) ?? [];

  const handleDrugClassChange = (
    selectedDrugClassOptions: DefaultDropdownMenuOption[],
  ) => {
    const selectedDrugClasses = selectedDrugClassOptions.map(
      ({ name }) => name,
    );

    dispatchUpdateDrugClassFilters({
      key: ColumnId.DRUG_CLASS,
      params: {
        multiSelected: selectedDrugClasses,
      },
      transform: (d: any) =>
        d.drugClass.split(";").map((s: string) => s.trim()),
      type: TypeFilterType.MULTIPLE,
    });
  };

  return hideFilters ? null : (
    <ComplexFilter
      options={drugClassOptions}
      onChange={selectedDrugClassOptions =>
        // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2345
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
  );
};
