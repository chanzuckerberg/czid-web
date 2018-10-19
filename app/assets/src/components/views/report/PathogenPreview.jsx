import React from "react";
import BasicPopup from "../../BasicPopup";
import Label from "../../ui/labels/Label";
import { CATEGORIES } from "../../ui/labels/PathogenLabel";

const PathogenPreview = ({ tag2Count }) => {
  let tags = Object.keys(tag2Count).sort();
  if (tags.length === 0) {
    return null;
  } else {
    let totalCount = Object.values(tag2Count).reduce((a, b) => a + b);
    let display = (
      <span className="idseq-ui pathogen-preview">
        {tags.map(type => {
          return (
            <Label circular color={CATEGORIES[type]["color"]} key={type} />
          );
        })}
        <span className="pathogen-count">{totalCount}</span>
      </span>
    );
    return (
      <BasicPopup
        trigger={display}
        content="Contains flagged pathogen species"
      />
    );
  }
};

export default PathogenPreview;
