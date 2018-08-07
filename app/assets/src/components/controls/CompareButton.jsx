import CompareIcon from "../icons/CompareIcon";
import PrimaryButton from "./PrimaryButton";
import PropTypes from "prop-types";
import React from "react";

const CompareButton = ({ disabled, onClick }) => {
  return (
    <PrimaryButton
      text="Compare"
      disabled={disabled}
      onClick={onClick}
      icon={<CompareIcon />}
    />
  );
};

CompareButton.propTypes = {
  disabled: PropTypes.bool,
  onClick: PropTypes.func
};

export default CompareButton;
