import PrimaryButton from "./PrimaryButton";
import BetaLabel from "../../labels/BetaLabel";
import PropTypes from "prop-types";
import React from "react";

const PhylogenyButton = ({ disabled, onClick }) => {
  return (
    <PrimaryButton
      text="View Phylogenies"
      label={<BetaLabel />}
      disabled={disabled}
      onClick={onClick}
    />
  );
};

PhylogenyButton.propTypes = {
  disabled: PropTypes.bool,
  onClick: PropTypes.func
};

export default PhylogenyButton;
