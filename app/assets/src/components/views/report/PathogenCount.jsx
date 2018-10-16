import React from "react";
import { CATEGORIES } from "../../ui/labels/PathogenLabel";

const PathogenCount = ({ tag2count }) => {
  let tags = Object.keys(tag2count).sort();
  if (tags.length === 0) {
    return null;
  } else {
    let totalCount = Object.values(tag2count).reduce((a, b) => a + b);
    let display = (
      <span>
        {totalCount}
        {tags.map(type => {
          return (
            <i
              className="fa fa-circle"
              style={{ color: CATEGORIES[type]["color"] }}
            />
          );
        })}
      </span>
    );
    return display;
  }
};

export default PathogenCount;
