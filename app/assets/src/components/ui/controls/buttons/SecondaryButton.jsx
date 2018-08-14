import Button from "./Button";
import PropTypes from "prop-types";
import React from "react";

const SecondaryButton = props => {
  return <Button {...props} secondary />;
};

export default SecondaryButton;
