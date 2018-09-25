import React from "react";
import PathogenLabel from "./PathogenLabel";

const PathogenSummary = ({ topScoringTaxa }) => {
  let topScoringDisplay, pathogenDisplay;

  if (topScoringTaxa.length > 0) {
    topScoringDisplay = (
      <div className="top-scoring">
        <div>Top Scoring</div>
        {topScoringTaxa.map(tax => {
          return <div>{tax.name}</div>;
        })}
      </div>
    );
  }

  let topPathogens = topScoringTaxa.filter(tax => tax.pathogenTag);
  if (topPathogens.length > 0) {
    pathogenDisplay = (
      <div className="top-pathogens">
        <div>Pathogenic Agents</div>
        {topPathogens.map(tax => {
          return (
            <div>
              {tax.name}
              <PathogenLabel type={tax.pathogenTag} />
            </div>
          );
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
