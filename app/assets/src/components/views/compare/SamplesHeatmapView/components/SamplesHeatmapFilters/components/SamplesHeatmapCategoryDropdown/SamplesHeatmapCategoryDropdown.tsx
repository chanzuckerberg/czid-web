import { Dropdown } from "czifui";
import { isEqual } from "lodash/fp";
import React, { useMemo } from "react";
import { trackEvent } from "~/api/analytics";
import { SelectedOptions, Subcategories } from "~/interface/shared";
import { OptionsType, SDSFormattedOption } from "../../SamplesHeatmapFilters";
import SamplesHeatmapCategoryFilterTags from "./components/SamplesHeatmapCategoryFilterTags";
import cs from "./samples_heatmap_category_dropdown.scss";

// N.B. A lot of the code in this component serves as an adapter between the data format expected by the SDS 'Dropdown' component (i.e., {name: foo}, with no hierarchies supported) and our existing heatmap filter data format used by all the existing state management machinery (i.e., the OnSelectedOptionsChangeDataType type below)

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
    return { name: option };
  });
};

const formatDropdownOptionsforExisting = (
  dropdownOptions: SDSFormattedOption[] = [],
): Categories => {
  return dropdownOptions.map(option => option.name);
};

const unflattenPhageSubcategory = (
  categories: Categories = [],
): { categories: Categories; subcategories: Subcategories } => {
  const subcategories = {};
  if (categories.includes(VIRUSES_PHAGE)) {
    categories = categories.filter(category => category !== VIRUSES_PHAGE);
    subcategories["Viruses"] = ["Phage"];
  }
  return { categories, subcategories };
};

const flattenPhageSubcategory = (
  categories: Categories = [],
  subcategories: Subcategories = {},
): Categories => {
  if (
    Object.keys(subcategories).includes("Viruses") &&
    Object.keys(subcategories).includes("Phage")
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

  /* Define event handlers */
  const onCategoryChange = (newCategoryOptions: SDSFormattedOption[]) => {
    if (!selectedOptions) return;

    const newCategories: Categories =
      formatDropdownOptionsforExisting(newCategoryOptions);

    const oldCategoriesIncludesViruses =
      selectedOptions.categories.includes("Viruses");
    const newCategoriesIncludesViruses = newCategories.includes("Viruses");

    // if they just added "Viruses", add "Viruses - Phage" as well
    if (!oldCategoriesIncludesViruses && newCategoriesIncludesViruses) {
      newCategories.push(VIRUSES_PHAGE);
    }

    const unflattenedNewCategories = unflattenPhageSubcategory(newCategories);

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
