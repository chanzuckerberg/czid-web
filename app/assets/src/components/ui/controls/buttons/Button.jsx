import { Button as BaseButton } from "semantic-ui-react";
import { forbidExtraProps } from "airbnb-prop-types";
import PropTypes from "prop-types";
import cx from "classnames";
import React from "react";

const Button = ({
  icon,
  label,
  text,
  hasDropdownArrow,
  className,
  rounded,
  ...props
}) => {
  let content = text;
  if (icon || label) {
    content = (
      <div className="icon-label">
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
        hasDropdownArrow && "has-dropdown-arrow"
      )}
    >
      {content}
      {hasDropdownArrow && <i className="icon-dropdown-arrow" />}
    </BaseButton>
  );
};

Button.propTypes = forbidExtraProps({
  disabled: PropTypes.bool,
  icon: PropTypes.element,
  label: PropTypes.element,
  onBlur: PropTypes.func,
  onFocus: PropTypes.func,
  onClick: PropTypes.func,
  onMouseLeave: PropTypes.func,
  onMouseEnter: PropTypes.func,
  text: PropTypes.string,
  primary: PropTypes.bool,
  secondary: PropTypes.bool,
  rounded: PropTypes.bool,
  className: PropTypes.string,
  hasDropdownArrow: PropTypes.bool
});

Button.defaultProps = {
  rounded: true
};

export default Button;
