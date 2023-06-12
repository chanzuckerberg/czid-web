import { ButtonDropdown as SDSButtonDropdown } from "@czi-sds/components";
import cx from "classnames";
import React from "react";
import { DropdownProps } from "semantic-ui-react";
import BareDropdown from "~ui/controls/dropdowns/BareDropdown";
import cs from "./button_dropdown.scss";

interface ButtonDropdownProps extends DropdownProps {
  className?: string;
  disabled?: boolean;
  icon?: React.ReactElement;
  onClick?: $TSFixMeFunction;
  items?: React.ReactNode[];
  options?: $TSFixMe[];
  primary?: boolean;
  secondary?: boolean;
  text?: string;
  direction?: "left" | "right";
}
const ButtonDropdown = ({
  className,
  disabled,
  icon,
  onClick,
  items,
  options,
  text,
  direction,
}: ButtonDropdownProps) => {
  const getButton = () => (
    <SDSButtonDropdown
      disabled={disabled}
      sdsStyle="rounded"
      sdsType="secondary"
      icon={icon}
    >
      {text}
    </SDSButtonDropdown>
  );

  return (
    <BareDropdown
      className={cx(cs.buttonDropdown, className)}
      hideArrow
      disabled={disabled}
      floating
      items={items}
      onChange={onClick}
      options={options}
      trigger={getButton()}
      direction={direction}
    />
  );
};

export default ButtonDropdown;
