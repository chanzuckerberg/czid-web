import React from "react";
import cx from "classnames";
import PropTypes from "prop-types";
import Label from "~/components/ui/labels/Label";
import cs from "./dropdown_label.scss";

const DropdownLabel = ({ text, disabled, className }) => (
  <Label
    circular
    className={cx(className, cs.dropdownLabel, disabled && cs.disabled)}
    text={text}
  />
);

DropdownLabel.propTypes = {
  disabled: PropTypes.bool,
  text: PropTypes.string,
  className: PropTypes.string
};

export default DropdownLabel;
