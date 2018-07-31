import Button from "./Button";
import PropTypes from "prop-types";
import React from "react";

const SecondaryButton = ({ text, disabled, icon, onClick }) => {
  return (
    <Button
      className="idseq-ui"
      secondary
      disabled={disabled}
      onClick={onClick}
      text={text}
      icon={icon}
    />
  );
};

SecondaryButton.propTypes = {
  text: PropTypes.string,
  onClick: PropTypes.func,
  disabled: PropTypes.bool
};

export default SecondaryButton;
