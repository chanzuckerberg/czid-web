import React from "react";

import Dropdown from "../../../ui/controls/dropdowns/Dropdown";
import PropTypes from "../../../utils/propTypes";

const SPECIFICITY_OPTIONS = [
  { text: "All", value: 0 },
  { text: "Specific Only", value: 1 },
];

const SpecificityFilter = ({ value, onChange, disabled = false }) => {
  return (
    <Dropdown
      options={SPECIFICITY_OPTIONS}
      value={value}
      label="Read Specificity"
      onChange={onChange}
      rounded
      disabled={disabled}
    />
  );
};

SpecificityFilter.propTypes = {
  disabled: PropTypes.bool,
  onChange: PropTypes.func.isRequired,
  value: PropTypes.number.isRequired,
};

export default SpecificityFilter;
