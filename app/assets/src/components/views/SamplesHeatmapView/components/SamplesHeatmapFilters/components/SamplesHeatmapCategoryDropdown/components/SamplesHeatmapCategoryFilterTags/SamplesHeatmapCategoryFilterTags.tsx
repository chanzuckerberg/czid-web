import React from "react";
import FilterTag from "~/components/ui/controls/FilterTag";
import { SelectedOptions } from "~/interface/shared/specific";
import { SDSFormattedOption } from "../../../../SamplesHeatmapFilters";
import SamplesHeatmapPresetTooltip from "../../../SamplesHeatmapPresetTooltip";
import cs from "./samples_heatmap_category_filter_tags.scss";

interface SamplesHeatmapCategoryFilterTagsPropsType {
  selectedOptions: SelectedOptions;
  disabled: boolean;
  handleRemoveCategoryFromTags: (categoryToRemove: string) => void;
  convertSelectedOptionsToSdsFormattedOptions: any;
}

export const SamplesHeatmapCategoryFilterTags = ({
  selectedOptions,
  disabled,
  handleRemoveCategoryFromTags,
  convertSelectedOptionsToSdsFormattedOptions,
}: SamplesHeatmapCategoryFilterTagsPropsType) => {
  const VIRUSES_PHAGE = "Viruses - Phage";

  // The filter tag should show "Phage" instead of "Viruses - Phage"
  const flattenedCategories: Array<SDSFormattedOption> =
    convertSelectedOptionsToSdsFormattedOptions(
      selectedOptions.categories,
      selectedOptions.subcategories,
    );

  let allTagNames = flattenedCategories.map(c => c.name);
  if (allTagNames.includes(VIRUSES_PHAGE)) {
    allTagNames = allTagNames.filter(tag => tag !== VIRUSES_PHAGE);
    allTagNames.push("Phage");
  }

  return (
    <div className={cs.filterTagsList}>
      {allTagNames.map((category, i) => {
        return (
          <div
            className={cs.filterTagContainer}
            key={`category-filter-tag-container-${i}`}
          >
            {/* @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2532 */}
            {selectedOptions.presets.includes("categories") ? (
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
                }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
};
