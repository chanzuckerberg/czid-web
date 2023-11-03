import React from "react";
import MultipleNestedDropdown from "../../../ui/controls/dropdowns/MultipleNestedDropdown";

interface CategoryFilterProps {
  allCategories: {
    name?: string;
  }[];
  categoryParentChild: Record<string, string[]>;
  categoryChildParent: Record<string, string>;
  disabled?: boolean;
  disableMarginRight: boolean;
  onChange: $TSFixMeFunction;
  selectedCategories: string[];
  selectedSubcategories: string[];
}

const CategoryFilter = ({
  allCategories,
  categoryParentChild,
  categoryChildParent,
  disabled = false,
  disableMarginRight,
  selectedCategories,
  selectedSubcategories,
  onChange,
}: CategoryFilterProps) => {
  const options: $TSFixMe = [];
  allCategories.forEach(category => {
    options.push({ text: category.name, value: category.name });

    const suboptions: $TSFixMe = [];
    // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2538
    (categoryParentChild[category.name] || []).forEach(
      (subcategory: $TSFixMe) => {
        suboptions.push({
          text: subcategory,
          value: subcategory,
        });
      },
    );
    if (suboptions.length > 0) {
      options[options.length - 1].suboptions = suboptions;
    }
  });

  const selectedSuboptions = {};
  selectedSubcategories.forEach(subcategory => {
    const category = categoryChildParent[subcategory];
    if (!selectedSuboptions[category]) {
      selectedSuboptions[category] = [];
    }
    selectedSuboptions[category].push(subcategory);
  });

  return (
    <MultipleNestedDropdown
      options={options}
      selectedOptions={selectedCategories}
      selectedSuboptions={selectedSuboptions}
      boxed
      rounded
      label="Categories"
      onChange={onChange}
      disableMarginRight={disableMarginRight}
      disabled={disabled}
    />
  );
};

export default CategoryFilter;
