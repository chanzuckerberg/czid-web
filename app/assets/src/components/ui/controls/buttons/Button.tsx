import cx from "classnames";
import React from "react";
import { Button as BaseButton } from "semantic-ui-react";

import { IconArrowDownSmall } from "~ui/icons";

const Button = ({
  circular,
  className,
  hasDropdownArrow,
  icon,
  label,
  labelClassName,
  rounded,
  text,
  ...props
}: ButtonProps) => {
  let content = text;
  if (icon || label) {
    content = (
      <div className={cx(labelClassName, "icon-label")}>
        {icon}
        {text}
        {label}
      </div>
    );
  }
  const cname = "idseq-ui";
  return (
    <BaseButton
      {...props}
      className={cx(
        cname,
        className,
        !rounded && "rectangular",
        circular && "circular",
        hasDropdownArrow && "has-dropdown-arrow",
      )}
    >
      {content}
      {hasDropdownArrow && (
        <IconArrowDownSmall className="icon-dropdown-arrow" />
      )}
    </BaseButton>
  );
};

interface ButtonProps {
  circular?: boolean;
  className: string;
  disabled?: boolean;
  hasDropdownArrow?: boolean;
  icon?: $TSFixMe;
  label?: string | $TSFixMe;
  labelClassName?: string;
  onBlur?: $TSFixMeFunction;
  onClick?: $TSFixMeFunction;
  onFocus?: React.MouseEvent<HTMLElement>;
  onMouseEnter?: React.MouseEvent<HTMLElement>;
  onMouseLeave?: React.MouseEvent<HTMLElement>;
  primary?: boolean;
  rounded?: boolean;
  secondary?: boolean;
  text?: string;
}

Button.defaultProps = {
  circular: false,
  rounded: true,
};

export default Button;
