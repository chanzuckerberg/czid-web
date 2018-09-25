import InsightIcon from "../../ui/icons/InsightIcon";
import React from "react";

const ReportInsightIcon = () => {
  let text =
    "Organisms with the highest values in the first score column, satisfying Z > 1 and rPM > 1";
  return <InsightIcon tooltip={text} />;
};

export default ReportInsightIcon;
