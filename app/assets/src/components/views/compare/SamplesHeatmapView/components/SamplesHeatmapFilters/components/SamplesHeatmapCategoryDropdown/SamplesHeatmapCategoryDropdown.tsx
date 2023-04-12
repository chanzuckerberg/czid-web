import { Dropdown } from "czifui";
import { isEqual } from "lodash/fp";
import React, { useMemo } from "react";
import { trackEvent } from "~/api/analytics";
import { SelectedOptions, Subcategories } from "~/interface/shared";
import { OptionsType, SDSFormattedOption } from "../../SamplesHeatmapFilters";
import SamplesHeatmapCategoryFilterTags from "./components/SamplesHeatmapCategoryFilterTags";
import cs from "./samples_heatmap_category_dropdown.scss";

// N.B. A lot of the code in this component serves as an adapter between the data format expected by the SDS 'Dropdown' component (i.e., {name: foo}, with no hierarchies supported) and our existing heatmap filter data format used by all the existing state management machinery (i.e., the OnSelectedOptionsChangeDataType type below)

// IMPORTANT NOTE -- I have *temporarily* put in a few patches to treat `Viruses` and `Viruses - Phage` as independent, mutually exclusive categories until the SDS team has a workaround that will enable us to show the input value change to include 'phage' whenever 'virueses' is selected in the dropdown UI, before the apply button is clicked. Once their change lands, we should revert the noted code below which will handle the auto-addition of 'phage'. See backlog ticket for this work: https://app.shortcut.com/idseq/story/230514/update-our-category-filter-to-handle-the-hierarchical-relationship-between-viruses-and-viruses-phage

type Categories = string[];

interface OnSelectedOptionsChangeDataType {
  categories?: Categories;
  subcategories?: Subcategories; //  {Viruses?: [] | ["Phage"]};
}

interface SamplesHeatmapCategoryDropdownPropsType {
  selectedOptions: SelectedOptions;
  onSelectedOptionsChange: (
    newOptions: OnSelectedOptionsChangeDataType,
  ) => void;
  disabled: boolean;
  options: OptionsType;
}

const VIRUSES_PHAGE = "Viruses - Phage";

/* Define options and current state for the dropdown */
const formatExistingOptionsForDropdown = (
  categoryOptions: Categories,
): SDSFormattedOption[] => {
  if (!categoryOptions) return [];

  return categoryOptions.map(option => {
    // N.B. - TODO - temporary change until SDS change described above is available
    const name = option === "Viruses" ? "Viruses - Non-phage" : option;
    return { name: name };
  });
};

const formatDropdownOptionsforExisting = (
  dropdownOptions: SDSFormattedOption[] = [],
): Categories => {
  return dropdownOptions.map(option =>
    // N.B. - TODO - temporary change until SDS change described above is available
    option.name === "Viruses - Non-phage" ? "Viruses" : option.name,
  );
};

const unflattenPhageSubcategory = (
  categories: Categories = [],
  shouldAddPhageSubcategory = false,
): { categories: Categories; subcategories: Subcategories } => {
  const subcategories = {};
  if (shouldAddPhageSubcategory) {
    subcategories["Viruses"] = ["Phage"];
  }

  return {
    categories: categories,
    subcategories: subcategories,
  };
};

const flattenPhageSubcategory = (
  categories: Categories = [],
  subcategories: Subcategories = {},
): Categories => {
  if (
    Object.keys(subcategories).includes("Viruses") &&
    subcategories["Viruses"].includes("Phage") &&
    !categories.includes(VIRUSES_PHAGE)
  ) {
    categories.push(VIRUSES_PHAGE);
  }

  return categories;
};

const sortCategoryOptions = (
  a: SDSFormattedOption,
  b: SDSFormattedOption,
): number => {
  if (a.name === "Uncategorized") {
    return 1;
  } else if (b.name === "Uncategorized") {
    return -1;
  } else {
    return a.name > b.name ? 1 : -1;
  }
};

export const SamplesHeatmapCategoryDropdown = ({
  disabled,
  selectedOptions,
  onSelectedOptionsChange,
  options,
}: SamplesHeatmapCategoryDropdownPropsType) => {
  const categoryOptions = useMemo(() => {
    const newOptions = formatExistingOptionsForDropdown(options?.categories);

    // Add one-off subcategory for phage
    newOptions.push({
      name: VIRUSES_PHAGE,
    });

    newOptions.sort(sortCategoryOptions);
    return newOptions;
  }, [options]);

  const value = useMemo(
    () =>
      formatExistingOptionsForDropdown(
        flattenPhageSubcategory(
          selectedOptions?.categories,
          selectedOptions?.subcategories,
        ),
      ),
    [selectedOptions],
  );

  // N.B. - TODO - temporary change until SDS change described above is available
  const shouldAddPhageSubcategory = false;

  // const shouldAddPhageSubcategory = (selectedOptions, newCategories) => {
  // const oldCategoriesIncludesViruses =
  //   selectedOptions.categories.includes("Viruses");
  // const oldCategoriesIncludesPhage = newCategories.includes(VIRUSES_PHAGE);
  // const newCategoriesIncludesViruses = newCategories.includes("Viruses");
  // (!oldCategoriesIncludesViruses &&
  //   !oldCategoriesIncludesPhage &&
  //   newCategoriesIncludesViruses) ||
  // newCategories.includes(VIRUSES_PHAGE)
  // };

  /* Define event handlers */
  const onCategoryChange = (newCategoryOptions: SDSFormattedOption[]) => {
    const newCategories: Categories =
      formatDropdownOptionsforExisting(newCategoryOptions);

    const unflattenedNewCategories = unflattenPhageSubcategory(
      newCategories,
      // N.B. - TODO - temporary change until SDS change described above is available
      shouldAddPhageSubcategory,
      // shouldAddPhageSubcategory(selectedOptions, newCategories),
    );

    const haveCategoriesChanged =
      !isEqual(
        selectedOptions.categories,
        unflattenedNewCategories.categories,
      ) ||
      !isEqual(
        selectedOptions.subcategories,
        unflattenedNewCategories.subcategories,
      );

    if (haveCategoriesChanged) {
      onSelectedOptionsChange(unflattenedNewCategories);

      trackEvent("SamplesHeatmapControls_category-filter_changed", {
        categories: unflattenedNewCategories.categories.length,
      });
    }
  };

  return (
    <div>
      <Dropdown
        value={value}
        options={categoryOptions}
        buttonPosition="right"
        onChange={onCategoryChange}
        label={<div className={cs.label}>Categories</div>}
        buttons
        multiple
        InputDropdownProps={{ sdsStyle: "minimal", disabled }}
        DropdownMenuProps={{
          title: "Select Categories",
        }}
        closeOnBlur
      />
      <SamplesHeatmapCategoryFilterTags
        selectedOptions={selectedOptions}
        currentDropdownValue={value}
        disabled={disabled}
        onCategoryChange={onCategoryChange}
        flattenPhageSubcategory={flattenPhageSubcategory}
      />
    </div>
  );
};
