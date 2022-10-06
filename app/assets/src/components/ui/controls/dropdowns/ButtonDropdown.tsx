import cx from "classnames";
import React from "react";
import BareDropdown from "~ui/controls/dropdowns/BareDropdown";
import PrimaryButton from "../buttons/PrimaryButton";
import SecondaryButton from "../buttons/SecondaryButton";
import cs from "./button_dropdown.scss";

interface ButtonDropdownProps {
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
  primary,
  text,
  direction,
}: ButtonDropdownProps) => {
  const getButton = () => {
    if (primary) {
      return (
        <PrimaryButton
          text={text}
          disabled={disabled}
          icon={icon}
          className={cs.button}
          hasDropdownArrow
        />
      );
    } else {
      return (
        <SecondaryButton
          text={text}
          disabled={disabled}
          icon={icon}
          className={cs.button}
          hasDropdownArrow
        />
      );
    }
  };

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
