import { Button as BaseButton } from "semantic-ui-react";
import { forbidExtraProps } from "airbnb-prop-types";
import PropTypes from "prop-types";
import React from "react";

const Button = ({
  disabled,
  onClick,
  icon,
  primary,
  secondary,
  text,
  type
}) => {
  let content = text;
  if (icon) {
    content = (
      <div className="icon-label">
        {icon}
        {text}
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
  onClick: PropTypes.func,
  text: PropTypes.string,
  primary: PropTypes.bool,
  secondary: PropTypes.bool,
  type: PropTypes.string
});

export default Button;
