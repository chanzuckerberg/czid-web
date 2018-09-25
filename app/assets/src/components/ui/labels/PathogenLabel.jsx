import Label from "./Label";
import React from "react";

const PathogenLabel = ({ type }) => {
  let categoryLabels = {
    categoryA: { text: "pathogenic | A", color: "red" },
    categoryB: { text: "pathogenic | B", color: "orange" },
    categoryC: { text: "pathogenic | C", color: "yellow" }
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
