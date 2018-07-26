import { Button } from "semantic-ui-react";
import PropTypes from "prop-types";
import React from "react";

const SecondaryButton = ({ text, disabled, onClick }) => {
  return (
    <Button secondary disabled={disabled} onClick={onClick}>
      {text}
    </Button>
  );
};

SecondaryButton.propTypes = {
  text: PropTypes.string,
  onClick: PropTypes.func,
  disabled: PropTypes.bool
};

export default SecondaryButton;
