import React from "react";

import PropTypes from "../../../utils/propTypes";
import OurDropdown from "../../../ui/controls/dropdowns/Dropdown";

const SPECIFICITY_OPTIONS = [
  { text: "All", value: 0 },
  { text: "Specific Only", value: 1 }
];

const SpecificityFilter = ({ value, onChange }) => {
  return (
    <OurDropdown
      options={SPECIFICITY_OPTIONS}
      value={value}
      label="Read Specificity: "
      onChange={onChange}
    />
  );
};

SpecificityFilter.propTypes = {
  value: PropTypes.number.isRequired,
  onChange: PropTypes.func.isRequired
};

export default SpecificityFilter;
