import { Button as BaseButton } from "semantic-ui-react";
import { forbidExtraProps } from "airbnb-prop-types";
import PropTypes from "prop-types";
import React from "react";

const Button = ({
  disabled,
  onClick,
  icon,
  label,
  primary,
  secondary,
  text
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
  return (
    <BaseButton
      className="idseq-ui"
      primary={primary}
      secondary={secondary}
      disabled={disabled}
      onClick={onClick}
    >
      {content}
    </BaseButton>
  );
};

Button.propTypes = forbidExtraProps({
  disabled: PropTypes.bool,
  icon: PropTypes.element,
  label: PropTypes.element,
  onClick: PropTypes.func,
  text: PropTypes.string,
  primary: PropTypes.bool,
  secondary: PropTypes.bool
});

export default Button;
