import React from "react";
import { trackEvent } from "~/api/analytics";
import FilterTag from "~/components/ui/controls/FilterTag";
import { SelectedOptions } from "~/interface/shared/specific";
import { SDSFormattedOption } from "../../../../SamplesHeatmapFilters";
import SamplesHeatmapPresetTooltip from "../../../SamplesHeatmapPresetTooltip";
import cs from "./samples_heatmap_category_filter_tags.scss";

interface SamplesHeatmapCategoryFilterTagsPropsType {
  selectedOptions: SelectedOptions;
  currentDropdownValue: SDSFormattedOption[];
  disabled: boolean;
  onCategoryChange: (newOptions: SDSFormattedOption[]) => void;
  flattenPhageSubcategory: (
    categories: string[],
    subcategories: any,
  ) => string[];
}

// selectedOptions refers to the current state of the filter
// currentDropdownValue refers to the current state of the dropdown
// the difference is largely formatting; see parent component for more details
export const SamplesHeatmapCategoryFilterTags = ({
  selectedOptions,
  currentDropdownValue,
  disabled,
  onCategoryChange,
  flattenPhageSubcategory,
}: SamplesHeatmapCategoryFilterTagsPropsType) => {
  const VIRUSES_PHAGE = "Viruses - Phage";

  const handleRemoveCategoryFromTags = (tagLabel: string) => {
    // The filter tags get labeled as 'Phage' instead of as 'Viruses - Phage', but all the other logic is based on 'Viruses - Phage'
    const categoryToRemove = tagLabel === "Phage" ? VIRUSES_PHAGE : tagLabel;
    const currentCategories: SDSFormattedOption[] = currentDropdownValue;

    const newCategories = currentCategories.filter(
      c => c.name !== categoryToRemove,
    );

    onCategoryChange(newCategories);
  };

  const { presets } = selectedOptions;

  // The filter tag should show "Phage" instead of "Viruses - Phage"
  let allTagNames: string[] = flattenPhageSubcategory(
    selectedOptions.categories,
    selectedOptions.subcategories,
  );

  if (allTagNames.includes(VIRUSES_PHAGE)) {
    allTagNames = allTagNames.filter(tag => tag !== VIRUSES_PHAGE);
    allTagNames.push("Phage");
  }

  const filterTags = allTagNames.map((category, i) => {
    return (
      <div
        className={cs.filterTagContainer}
        key={`category-filter-tag-container-${i}`}>
        {presets.includes("categories") ? (
          <SamplesHeatmapPresetTooltip
            component={<FilterTag text={category} />}
            className={cs.filterTag}
            key={`category_filter_tag_${i}`}
          />
        ) : (
          <FilterTag
            className={cs.filterTag}
            key={`category_filter_tag_${i}`}
            text={category}
            disabled={disabled}
            onClose={() => {
              handleRemoveCategoryFromTags(category);
              trackEvent("SamplesHeatmapControl_categories-filter_removed", {
                category,
              });
            }}
          />
        )}
      </div>
    );
  });

  return <div className={cs.filterTagsList}>{filterTags}</div>;
};
