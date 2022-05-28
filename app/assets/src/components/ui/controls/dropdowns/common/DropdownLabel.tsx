import cx from "classnames";
import React from "react";
import Label from "~/components/ui/labels/Label";
import cs from "./dropdown_label.scss";

interface DropdownLabelProps {
  disabled?: boolean;
  text?: string;
  className?: string;
  disableMarginRight?: boolean;
}

const DropdownLabel = ({ text, disabled, className }: DropdownLabelProps) => (
  <Label
    circular
    className={cx(className, cs.dropdownLabel, disabled && cs.disabled)}
    text={text}
  />
);

export default DropdownLabel;
