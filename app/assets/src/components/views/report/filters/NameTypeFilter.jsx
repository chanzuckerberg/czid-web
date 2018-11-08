import React from "react";

import PropTypes from "../../../utils/propTypes";
import Dropdown from "../../../ui/controls/dropdowns/Dropdown";

const NAME_TYPE_OPTIONS = [
  { text: "Scientific", value: "Scientific name" },
  { text: "Common", value: "Common name" }
];

const NameTypeFilter = ({ value, onChange }) => {
  return (
    <Dropdown
      options={NAME_TYPE_OPTIONS}
      value={value}
      label="Name Type: "
      onChange={onChange}
      rounded
    />
  );
};

NameTypeFilter.propTypes = {
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired
};

export default NameTypeFilter;
