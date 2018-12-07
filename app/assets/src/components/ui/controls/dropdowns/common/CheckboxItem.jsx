import React from "react";
import PropTypes from "prop-types";
import BareDropdown from "../BareDropdown";
import Checkbox from "../../Checkbox";

const stopEventPropagation = e => e.stopPropagation();

const CheckboxItem = ({ value, label, checked, onOptionClick }) => (
  <BareDropdown.Item onClick={stopEventPropagation}>
    <Checkbox
      value={value}
      label={label}
      checked={checked}
      onChange={onOptionClick}
    />
  </BareDropdown.Item>
);

CheckboxItem.propTypes = {
  value: PropTypes.any,
  label: PropTypes.string,
  checked: PropTypes.bool,
  onOptionClick: PropTypes.func
};

export default CheckboxItem;
