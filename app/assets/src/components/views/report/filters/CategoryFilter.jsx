import React from "react";

import PropTypes from "../../../utils/propTypes";
import MultipleNestedDropdown from "../../../ui/controls/dropdowns/MultipleNestedDropdown";

const CategoryFilter = ({
  allCategories,
  categoryParentChild,
  categoryChildParent,
  selectedCategories,
  selectedSubcategories,
  onChange
}) => {
  let options = [];
  allCategories.forEach(category => {
    options.push({ text: category.name, value: category.name });

    let suboptions = [];
    (categoryParentChild[category.name] || []).forEach(subcategory => {
      suboptions.push({
        text: subcategory,
        value: subcategory
      });
    });
    if (suboptions.length > 0) {
      options[options.length - 1].suboptions = suboptions;
    }
  });

  let selectedSuboptions = {};
  selectedSubcategories.forEach(subcategory => {
    let category = categoryChildParent[subcategory];
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
      label="Categories: "
      onChange={onChange}
    />
  );
};

CategoryFilter.propTypes = {
  allCategories: PropTypes.arrayOf(
    PropTypes.shape({
      taxid: PropTypes.number,
      name: PropTypes.string
    })
  ).isRequired,
  categoryParentChild: PropTypes.objectOf(PropTypes.arrayOf(PropTypes.string))
    .isRequired,
  categoryChildParent: PropTypes.objectOf(PropTypes.string).isRequired,
  selectedCategories: PropTypes.arrayOf(PropTypes.string).isRequired,
  selectedSubcategories: PropTypes.arrayOf(PropTypes.string).isRequired,
  onChange: PropTypes.func.isRequired
};

export default CategoryFilter;
