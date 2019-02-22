import React from "react";
import PropTypes from "prop-types";
import BareDropdown from "../BareDropdown";
import CheckmarkIcon from "~ui/icons/CheckmarkIcon";
import cs from "./checkbox_item.scss";
import cx from "classnames";

const CheckboxItem = ({ value, label, checked, onOptionClick }) => (
  <BareDropdown.Item
    onClick={e => {
      e.stopPropagation();
      onOptionClick(value, !checked);
    }}
  >
    <div className={cs.listElement}>
      <div className={cs.listCheckmark}>
        <CheckmarkIcon size="small" className={cx(!checked && cs.disabled)} />
      </div>
      <div className={cs.listLabel}>{label}</div>
    </div>
  </BareDropdown.Item>
);

CheckboxItem.propTypes = {
  value: PropTypes.any,
  label: PropTypes.string,
  checked: PropTypes.bool,
  onOptionClick: PropTypes.func
};

export default CheckboxItem;
