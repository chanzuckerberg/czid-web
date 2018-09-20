import Label from "./Label";
import React from "react";

const PathogenLabel = ({ type, number }) => {
  let type2text = {
    category_A: "priority A pathogen",
    category_B: "priority B pathogen",
    category_C: "priority C pathogen"
  };
  let text = type2text[type];
  if (number) {
    let plural = number > 1 ? "s" : "";
    text = `${number} ${text}${plural}`;
  }
  if (type) {
    return (
      <Label text={text} color="red" size="medium" className="pathogen-label" />
    );
  } else {
    return null;
  }
};

export default PathogenLabel;
