import { Dropdown } from "czifui";
import React from "react";
import { trackEvent } from "~/api/analytics";
import { SelectedOptions } from "~/interface/shared";
import { OptionsType, SDSFormattedOption } from "../SamplesHeatmapFilters";

interface SamplesHeatmapCategoryDropdownPropsType {
  selectedOptions: SelectedOptions;
  disabled: boolean;
  onSelectedOptionsChange: {
    ({
      categoryNames,
      subcategoryNames,
    }: {
      categoryNames: string[];
      subcategoryNames: { [key: string]: string[] };
    }): void;
  };
  options: OptionsType;
}

export const SamplesHeatmapCategoryDropdown = ({
  disabled,
  onSelectedOptionsChange,
  options,
}: SamplesHeatmapCategoryDropdownPropsType) => {
  const onCategoryChange = (categories: SDSFormattedOption[]) => {
    let categoryNames = categories.map(category => category.name);

    let subcategoryNames = {};
    if (categoryNames.includes("Viruses - Phage")) {
      categoryNames = categoryNames.filter(
        (name: string) => name !== "Viruses - Phage",
      );
      subcategoryNames = { Viruses: ["Phage"] };
    }

    onSelectedOptionsChange({ categoryNames, subcategoryNames });
    trackEvent("SamplesHeatmapControls_category-filter_changed", {
      categories: categories.length,
    });
  };

  const categoryOptions = options.categories.map(option => {
    return { name: option, value: option };
  });

  // Add one-off subcategory for phage
  categoryOptions.push({
    name: "Viruses - Phage",
    value: "Viruses - Phage",
  });

  const sortCategoryOptions = (
    a: SDSFormattedOption,
    b: SDSFormattedOption,
  ) => {
    if (a.name === "Uncategorized") {
      return 1;
    } else if (b.name === "Uncategorized") {
      return -1;
    } else {
      return a.name > b.name ? 1 : -1;
    }
  };

  categoryOptions.sort(sortCategoryOptions);

  return (
    <Dropdown
      options={categoryOptions}
      onChange={newValue => {
        onCategoryChange(newValue);
      }}
      label="Categories"
      InputDropdownProps={{ sdsStyle: "minimal", disabled: disabled }}
      buttons
      multiple
    />
  );
};

// const handleRemoveCategory = (category: $TSFixMe) => {
//   const newCategories = pull(category, selectedOptions.categories);
//   onSelectedOptionsChange({ categories: newCategories });
// };

// const handleRemoveSubcategory = (subcat: $TSFixMe) => {
//   // For each category => [subcategories], remove subcat from subcategories.
//   // Then omit all categories with empty subcategories.
//   const newSubcategories = omitBy(
//     isEmpty,
//     mapValues(pull(subcat), selectedOptions.subcategories),
//   );
//   onSelectedOptionsChange({ subcategories: newSubcategories });
// };

//       );
