import CompareIcon from "../icons/CompareIcon";
import PrimaryButton from "./PrimaryButton";
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

export default CompareButton;
