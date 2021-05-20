import React from "react";

import Dropdown from "../../../ui/controls/dropdowns/Dropdown";
import PropTypes from "../../../utils/propTypes";

const NAME_TYPE_OPTIONS = [
  { text: "Scientific", value: "Scientific name" },
  { text: "Common", value: "Common name" },
];

const NameTypeFilter = ({ value, onChange, disabled = false }) => {
  return (
    <Dropdown
      options={NAME_TYPE_OPTIONS}
      value={value}
      label="Name Type"
      onChange={onChange}
      rounded
      disabled={disabled}
    />
  );
};

NameTypeFilter.propTypes = {
  disabled: PropTypes.bool,
  onChange: PropTypes.func.isRequired,
  value: PropTypes.string.isRequired,
};

export default NameTypeFilter;
