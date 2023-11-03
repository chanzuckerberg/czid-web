import cx from "classnames";
import { kebabCase } from "lodash";
import React from "react";
import { Button as BaseButton, StrictButtonProps } from "semantic-ui-react";
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
  // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2322
  let content: JSX.Element | string = text;
  if (icon || label) {
    content = (
      <div
        data-testid={`${kebabCase(text)}-button`}
        className={cx(labelClassName, "icon-label")}
      >
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

export interface ButtonProps extends StrictButtonProps {
  circular?: boolean;
  className?: string;
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
