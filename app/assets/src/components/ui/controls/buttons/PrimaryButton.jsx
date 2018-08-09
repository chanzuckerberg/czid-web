import Button from "./Button";
import PropTypes from "prop-types";
import React from "react";

const PrimaryButton = props => {
  return <Button {...props} primary />;
};

export default PrimaryButton;
