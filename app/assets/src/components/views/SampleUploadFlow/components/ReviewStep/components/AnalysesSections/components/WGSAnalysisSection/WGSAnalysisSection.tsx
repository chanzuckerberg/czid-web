import React from "react";
import cs from "../../analyses_sections.scss";

interface WGSAnalysisSectionType {
  bedFile: string;
  refSeqFile: string;
  taxon: string;
}

const WGSAnalysisSection = ({
  bedFile,
  refSeqFile,
  taxon,
}: WGSAnalysisSectionType) => {
  return (
    <>
      <div className={cs.item}>
        <div className={cs.subheader}>Taxon Name:</div>
        <div className={cs.description}>{taxon ?? "unknown"}</div>
      </div>
      <div className={cs.item}>
        <div className={cs.subheader}>Reference Sequence:</div>
        <div className={cs.description}>{refSeqFile}</div>
      </div>
      <div className={cs.item}>
        <div className={cs.subheader}>Trim Primer:</div>
        <div className={cs.description}>{bedFile}</div>
      </div>
    </>
  );
};

export { WGSAnalysisSection };
