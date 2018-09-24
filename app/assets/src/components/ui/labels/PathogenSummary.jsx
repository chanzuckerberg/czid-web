import React from "react";
import PathogenLabel from "./PathogenLabel";

const PathogenSummary = ({ topScoringTaxa, pathogenTagSummary }) => {
  let topScoringDisplay, pathogenDisplay;

  if (topScoringTaxa.length > 0) {
    topScoringDisplay = (
      <div>
        Top scoring:
        {topScoringTaxa.map(tax => tax.name).join(", ")}
      </div>
    );
  }

  if (Object.keys(pathogenTagSummary).length > 0) {
    let categories = Object.keys(pathogenTagSummary);
    categories.sort();
    pathogenDisplay = (
      <div>
        NIAID emerging pathogens:{" "}
        {categories.map(cat => {
          return <PathogenLabel number={pathogenTagSummary[cat]} type={cat} />;
        })}
      </div>
    );
  }

  if (topScoringDisplay || pathogenDisplay) {
    return (
      <div className="ui message yellow idseq-ui pathogen-summary">
        {topScoringDisplay}
        {pathogenDisplay}
      </div>
    );
  } else {
    return null;
  }
};

export default PathogenSummary;
