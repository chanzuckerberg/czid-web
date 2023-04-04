import { Dropdown } from "czifui";
import React from "react";
import { trackEvent } from "~/api/analytics";
import FilterTag from "~/components/ui/controls/FilterTag";
import { SelectedOptions } from "~/interface/shared";
import { OptionsType, SDSFormattedOption } from "../SamplesHeatmapFilters";
import SamplesHeatmapPresetTooltip from "../SamplesHeatmapPresetTooltip";
import cs from "./samples_heatmap_category_dropdown.scss";

type OnSelectedOptionsChangeCategoryType = (newOptions: {
  categories?: string[];
  subcategories?: { [key: string]: string[] };
}) => void;

interface SamplesHeatmapCategoryDropdownPropsType {
  selectedOptions: SelectedOptions;
  onSelectedOptionsChange: OnSelectedOptionsChangeCategoryType;
  disabled: boolean;
  options: OptionsType;
}

export const SamplesHeatmapCategoryDropdown = ({
  disabled,
  selectedOptions,
  onSelectedOptionsChange,
  options,
}: SamplesHeatmapCategoryDropdownPropsType) => {
  const formatOptionsForSDS = (options: string[]) => {
    return options.map(option => {
      return { name: option };
    });
  };

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

  const onCategoryChange = (categories: SDSFormattedOption[]) => {
    let categoryNames: string[] = categories.map(category => category.name);

    let subcategoryNames = {};
    if (categoryNames.includes(VIRUSES_PHAGE)) {
      categoryNames = categoryNames.filter(
        (name: string) => name !== VIRUSES_PHAGE,
      );
      subcategoryNames = { Viruses: ["Phage"] };
    }

    onSelectedOptionsChange({
      categories: categoryNames,
      subcategories: subcategoryNames,
    });
    trackEvent("SamplesHeatmapControls_category-filter_changed", {
      categories: categories.length,
    });
  };

  const handleRemoveCategory = (category: string) => {
    const newCategories = selectedOptions.categories.filter(
      (c: string) => c !== category,
    );

    const newSubcategories =
      category === "Phage" ? {} : selectedOptions.subcategories;

    onSelectedOptionsChange({
      categories: newCategories,
      subcategories: newSubcategories,
    });
  };

  const renderFilterTags = () => {
    const { presets } = selectedOptions;

    if (
      selectedOptions.categories.length === 0 &&
      Object.keys(selectedOptions.subcategories).length === 0
    ) {
      return null;
    }

    const allTagNames = selectedOptions.categories.concat(
      Object.values(selectedOptions.subcategories).flat(),
    );
    const filterTags = allTagNames.map((category, i) => {
      if (presets.includes("categories")) {
        return (
          <SamplesHeatmapPresetTooltip
            component={<FilterTag text={category} />}
            className={cs.filterTag}
            key={`category_filter_tag_${i}`}
          />
        );
      } else {
        return (
          <FilterTag
            className={cs.filterTag}
            key={`category_filter_tag_${i}`}
            text={category}
            disabled={disabled}
            onClose={() => {
              handleRemoveCategory(category);
              trackEvent("SamplesHeatmapControl_categories-filter_removed", {
                category,
              });
            }}
          />
        );
      }
    });

    return <div className={cs.filterTagsContainer}>{filterTags}</div>;
  };

  const categoryOptions = formatOptionsForSDS(options.categories);

  // Add one-off subcategory for phage
  const VIRUSES_PHAGE = "Viruses - Phage";
  categoryOptions.push({
    name: VIRUSES_PHAGE,
  });

  categoryOptions.sort(sortCategoryOptions);

  const value = formatOptionsForSDS(
    selectedOptions.categories.concat(
      Object.values(selectedOptions.subcategories).flat(),
    ),
  );

  return (
    <div>
      <Dropdown
        options={categoryOptions}
        onChange={newValue => {
          if (newValue.length > 0) {
            onCategoryChange(newValue);
          }
        }}
        label="Categories"
        InputDropdownProps={{ sdsStyle: "minimal", disabled: disabled }}
        buttons
        multiple
        value={value}
        DropdownMenuProps={{
          isOptionEqualToValue: (option, value) => {
            return option.name === value.name;
          },
        }}
        closeOnBlur={true}
      />
      {renderFilterTags()}
    </div>
  );
};
