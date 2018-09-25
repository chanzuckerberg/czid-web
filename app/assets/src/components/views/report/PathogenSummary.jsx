import React from "react";
import InsightMessage from "../../layout/InsightMessage";
import PathogenLabel from "../../ui/labels/PathogenLabel";
import BetaLabel from "../../ui/labels/BetaLabel";
import ReportInsightIcon from "./ReportInsightIcon";

const PathogenSummary = ({ topScoringTaxa }) => {
  let topScoringDisplay, pathogenDisplay;

  if (topScoringTaxa.length > 0) {
    topScoringDisplay = (
      <div className="top-scoring">
        <div className="header">Top Scoring</div>
        <ul>
          {topScoringTaxa.map(tax => {
            return <li>{tax.name}</li>;
          })}
        </ul>
      </div>
    );
  }

  let topPathogens = topScoringTaxa.filter(tax => tax.pathogenTag);
  if (topPathogens.length > 0) {
    pathogenDisplay = (
      <div className="top-pathogens">
        <div className="header">Pathogenic Agents</div>
        <ul>
          {topPathogens.map(tax => {
            return (
              <li>
                <span>{tax.name}</span>
                <PathogenLabel type={tax.pathogenTag} />
              </li>
            );
          })}
        </ul>
      </div>
    );
  }

  if (topScoringDisplay || pathogenDisplay) {
    let insightContent = (
      <div className="pathogen-summary">
        <ReportInsightIcon className="summary-icon" />
        {topScoringDisplay}
        {pathogenDisplay}
        <BetaLabel />
      </div>
    );
    return <InsightMessage content={insightContent} />;
  } else {
    return null;
  }
};

export default PathogenSummary;
