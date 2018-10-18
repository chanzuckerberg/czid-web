import React from "react";
import Label from "../../ui/labels/Label";
import { CATEGORIES } from "../../ui/labels/PathogenLabel";

const PathogenCount = ({ tag2count }) => {
  let tags = Object.keys(tag2count).sort();
  if (tags.length === 0) {
    return null;
  } else {
    let totalCount = Object.values(tag2count).reduce((a, b) => a + b);
    let display = (
      <span className="idseq-ui pathogen-preview">
        {tags.map(type => {
          return (
            <Label circular color={CATEGORIES[type]["color"]} size="mini" />
          );
        })}
        <span className="pathogen-count">{totalCount}</span>
      </span>
    );
    return display;
  }
};

export default PathogenCount;
