import { forbidExtraProps } from "airbnb-prop-types";
import cx from "classnames";
import PropTypes from "prop-types";
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
}) => {
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
  let cname = "idseq-ui";
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

Button.propTypes = forbidExtraProps({
  circular: PropTypes.bool,
  className: PropTypes.string,
  disabled: PropTypes.bool,
  hasDropdownArrow: PropTypes.bool,
  icon: PropTypes.element,
  label: PropTypes.oneOfType([PropTypes.element, PropTypes.string]),
  labelClassName: PropTypes.string,
  onBlur: PropTypes.func,
  onClick: PropTypes.func,
  onFocus: PropTypes.func,
  onMouseEnter: PropTypes.func,
  onMouseLeave: PropTypes.func,
  primary: PropTypes.bool,
  rounded: PropTypes.bool,
  secondary: PropTypes.bool,
  text: PropTypes.string,
});

Button.defaultProps = {
  circular: false,
  rounded: true,
};

export default Button;
