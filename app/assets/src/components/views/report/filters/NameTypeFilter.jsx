import React from "react";

import PropTypes from "../../../utils/propTypes";
import OurDropdown from "../../../ui/controls/dropdowns/Dropdown";

const NAME_TYPE_OPTIONS = [
  { text: "Scientific", value: "Scientific name" },
  { text: "Common", value: "Common name" }
];

const NameTypeFilter = ({ value, onChange }) => {
  return (
    <OurDropdown
      options={NAME_TYPE_OPTIONS}
      value={value}
      label="Name Type: "
      onChange={onChange}
    />
  );
};

NameTypeFilter.propTypes = {
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired
};

export default NameTypeFilter;
