import Label from "./Label";
import React from "react";

const PathogenLabel = ({ type }) => {
  let type2text = {
    category_A: "priority A pathogen",
    category_B: "priority B pathogen",
    category_C: "priority C pathogen"
  };
  let text = type2text[type];
  return <Label text={text} color="red" size="medium" />;
};

export default PathogenLabel;
