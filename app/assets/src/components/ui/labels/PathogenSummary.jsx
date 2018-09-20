import React from "react";
import PathogenLabel from "./PathogenLabel";

const PathogenSummary = ({ pathogenTagSummary }) => {
  let categories = Object.keys(pathogenTagSummary);
  categories.sort();
  let tag_counts = (
    <span>
      {categories.map(cat => {
        return <PathogenLabel type={cat} number={pathogenTagSummary[cat]} />;
      })}
    </span>
  );

  if (Object.keys(pathogenTagSummary).length > 0) {
    return (
      <div className="ui message orange idseq-ui pathogen-summary">
        NIAID emerging pathogens: {tag_counts}
      </div>
    );
  } else {
    return null;
  }
};

export default PathogenSummary;
