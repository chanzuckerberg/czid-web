import Label from "./Label";
import React from "react";

const PathogenLabel = ({ type }) => {
  let categoryLabels = {
    categoryA: { text: "pathogenic | a", color: "red" },
    categoryB: { text: "pathogenic | b", color: "orange" },
    categoryC: { text: "pathogenic | c", color: "yellow" }
  };
  if (type) {
    return (
      <Label
        text={categoryLabels[type]["text"]}
        color={categoryLabels[type]["color"]}
        size="medium"
        className="pathogen-label"
      />
    );
  } else {
    return null;
  }
};

export default PathogenLabel;
