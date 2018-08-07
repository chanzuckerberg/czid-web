import Button from "./Button";
import PropTypes from "prop-types";
import React from "react";

const PrimaryButton = ({ disabled, icon, onClick, text, type }) => {
  return (
    <Button
      className="idseq-ui"
      primary
      disabled={disabled}
      onClick={onClick}
      text={text}
      icon={icon}
      type={type}
    />
  );
};

PrimaryButton.propTypes = {
  disabled: PropTypes.bool,
  icon: PropTypes.element,
  onClick: PropTypes.func,
  text: PropTypes.string,
  type: PropTypes.string
};

export default PrimaryButton;
