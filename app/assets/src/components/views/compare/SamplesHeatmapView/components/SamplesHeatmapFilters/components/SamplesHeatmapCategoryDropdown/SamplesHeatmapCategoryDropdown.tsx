import { Dropdown } from "czifui";
import React, { useState } from "react";
import { SelectedOptions, Subcategories } from "~/interface/shared";
import { OptionsType, SDSFormattedOption } from "../../SamplesHeatmapFilters";
import SamplesHeatmapCategoryFilterTags from "./components/SamplesHeatmapCategoryFilterTags";
import cs from "./samples_heatmap_category_dropdown.scss";

type Categories = string[];

interface OnSelectedOptionsChangeDataType {
  categories?: Categories;
  subcategories?: Subcategories; //  {Viruses?: [] | ["Phage"]};
}

const VIRUSES_PHAGE = "Viruses - Phage";
const VIRUSES_NON_PHAGE = "Viruses - Non-Phage";

interface SamplesHeatmapCategoryDropdownPropsType {
  selectedOptions: SelectedOptions;
  onSelectedOptionsChange: (
    newOptions: OnSelectedOptionsChangeDataType,
  ) => void;
  disabled: boolean;
  options: OptionsType;
}

const convertSelectedOptionsToSdsFormattedOptions = (
  categories,
  subcategories,
) => {
  const sdsFormattedOptions = categories.map(category => {
    const name: string = category !== "Viruses" ? category : VIRUSES_NON_PHAGE;
    return { name };
  });
  if (subcategories["Viruses"] && subcategories["Viruses"].includes("Phage")) {
    sdsFormattedOptions.splice(-1, 0, { name: VIRUSES_PHAGE });
  }
  return sdsFormattedOptions;
};

export const SamplesHeatmapCategoryDropdown = ({
  selectedOptions,
  onSelectedOptionsChange,
  disabled,
  options,
}: SamplesHeatmapCategoryDropdownPropsType) => {
  /* Because our options are objects and we need to do a fair amount of manipulation on their values to manage the phage / virus hierarchy in the parent View component's state data structure, we need to be careful to avoid mutating the original options object's reference.
  We do this in two ways: (1) managing state locally as much as possible and (2) using `splice` to manipulate values without changing the reference.
  */
  const [sdsFormattedValue, setSdsFormattedValue] = useState<
    SDSFormattedOption[]
  >(
    convertSelectedOptionsToSdsFormattedOptions(
      selectedOptions.categories,
      selectedOptions.subcategories,
    ),
  );

  const categoryOptions = options.categories.map((category: string) => {
    const name = category !== "Viruses" ? category : VIRUSES_NON_PHAGE;
    return { name };
  });
  categoryOptions.splice(-2, 0, { name: VIRUSES_PHAGE });

  // Reformats the selected options to be compatible with the parent component's state data structure
  const onApply = (newOptions: SDSFormattedOption[]) => {
    const newSubcategories = {};
    const newCategoriesAsStrings = newOptions.map(option => option.name);

    // if present, move phage out of the category list and into the subcategory list
    const indexOfVirusesPhage = newCategoriesAsStrings.indexOf(VIRUSES_PHAGE);
    if (indexOfVirusesPhage !== -1) {
      newCategoriesAsStrings.splice(indexOfVirusesPhage, 1);
      newSubcategories["Viruses"] = ["Phage"];
    }

    // if present, rename Viruses - Non-phage to Viruses
    const indexOfVirusesNonPhage =
      newCategoriesAsStrings.indexOf(VIRUSES_NON_PHAGE);
    if (indexOfVirusesNonPhage !== -1) {
      newCategoriesAsStrings.splice(indexOfVirusesNonPhage, 1, "Viruses");
    }

    onSelectedOptionsChange({
      categories: newCategoriesAsStrings,
      subcategories: newSubcategories,
    });
  };

  const handleRemoveCategoryFromTags = (categoryToRemove: string) => {
    // The filter tags get labeled as 'Phage' instead of as 'Viruses - Phage', but all the other logic is based on 'Viruses - Phage'
    let updatedCategoryToRemove = categoryToRemove;
    if (categoryToRemove === "Phage") {
      updatedCategoryToRemove = VIRUSES_PHAGE;
    } else if (categoryToRemove === "Viruses") {
      updatedCategoryToRemove = VIRUSES_NON_PHAGE;
    }

    const currentCategoriesAsStrings = sdsFormattedValue.map(
      (c: SDSFormattedOption) => c.name,
    );

    const indexOfCategoryToRemove = currentCategoriesAsStrings.indexOf(
      updatedCategoryToRemove,
    );
    sdsFormattedValue.splice(indexOfCategoryToRemove, 1);

    setSdsFormattedValue(sdsFormattedValue);
    onApply(sdsFormattedValue);
  };

  return (
    <div>
      <Dropdown
        label={<div className={cs.label}>Categories</div>}
        multiple
        options={categoryOptions}
        value={sdsFormattedValue}
        onChange={newDropdownValue => {
          setSdsFormattedValue(newDropdownValue);
          onApply(newDropdownValue);
        }}
        buttons
        buttonPosition="left"
        InputDropdownProps={{ sdsStyle: "minimal", disabled }}
        DropdownMenuProps={{
          title: "Select Categories",
        }}
        closeOnBlur
      />
      <SamplesHeatmapCategoryFilterTags
        selectedOptions={selectedOptions}
        currentDropdownValue={sdsFormattedValue}
        disabled={disabled}
        handleRemoveCategoryFromTags={handleRemoveCategoryFromTags}
        convertSelectedOptionsToSdsFormattedOptions={
          convertSelectedOptionsToSdsFormattedOptions
        }
      />
    </div>
  );
};
