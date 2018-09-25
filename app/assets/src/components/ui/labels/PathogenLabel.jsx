import Label from "./Label";
import React from "react";

const PathogenLabel = ({ type }) => {
  let categoryLabels = {
    categoryA: "pathogenic | A",
    categoryB: "pathogenic | B",
    categoryC: "pathogenic | C"
  };
  let text = categoryLabels[type];
  if (type) {
    return (
      <Label text={text} color="red" size="medium" className="pathogen-label" />
    );
  } else {
    return null;
  }
};

export default PathogenLabel;
