import { Button } from "semantic-ui-react";
import PropTypes from "prop-types";
import React from "react";

const PrimaryButton = ({ text, disabled, onClick }) => {
  return (
    <Button primary disabled={disabled} onClick={onClick}>
      {text}
    </Button>
  );
};

PrimaryButton.propTypes = {
  text: PropTypes.string,
  onClick: PropTypes.func,
  disabled: PropTypes.bool
};

export default PrimaryButton;
