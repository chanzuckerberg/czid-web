import Button from "./Button";
import PropTypes from "prop-types";
import React from "react";

const PrimaryButton = ({ text, disabled, icon, onClick }) => {
  return (
    <Button
      className="idseq-ui"
      primary
      disabled={disabled}
      onClick={onClick}
      text={text}
      icon={icon}
    />
  );
};

PrimaryButton.propTypes = {
  text: PropTypes.string,
  onClick: PropTypes.func,
  disabled: PropTypes.bool
};

export default PrimaryButton;
