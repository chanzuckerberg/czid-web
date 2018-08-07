import Button from "./Button";
import PropTypes from "prop-types";
import React from "react";

const SecondaryButton = ({ disabled, icon, onClick, text, type }) => {
  return (
    <Button
      className="idseq-ui"
      secondary
      disabled={disabled}
      onClick={onClick}
      text={text}
      icon={icon}
      type={type}
    />
  );
};

SecondaryButton.propTypes = {
  disabled: PropTypes.bool,
  icon: PropTypes.element,
  onClick: PropTypes.func,
  text: PropTypes.string,
  type: PropTypes.string
};

export default SecondaryButton;
