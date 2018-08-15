import PrimaryButton from "./PrimaryButton";
import PropTypes from "prop-types";
import React from "react";

const PhylogenyButton = ({ disabled, onClick }) => {
  return (
    <PrimaryButton text="Phylogenies" disabled={disabled} onClick={onClick} />
  );
};

PhylogenyButton.propTypes = {
  disabled: PropTypes.bool,
  onClick: PropTypes.func
};

export default PhylogenyButton;
