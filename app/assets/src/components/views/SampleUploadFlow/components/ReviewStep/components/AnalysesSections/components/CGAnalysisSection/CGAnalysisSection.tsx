import React from "react";
import {
  CG_WETLAB_DISPLAY_NAMES,
  SEQUENCING_TECHNOLOGY_OPTIONS,
  Technology,
} from "~/components/views/SampleUploadFlow/constants";
import cs from "../../analyses_sections.scss";

interface CGAnalysisSectionType {
  clearlabs: boolean;
  medakaModel: string;
  technology: Technology;
  wetlabProtocol: string;
}

export const CGAnalysisSection = ({
  clearlabs,
  medakaModel,
  technology,
  wetlabProtocol,
}: CGAnalysisSectionType) => {
  return (
    <>
      {technology === SEQUENCING_TECHNOLOGY_OPTIONS.NANOPORE && (
        <div className={cs.item}>
          <div className={cs.subheader}>Used Clear Labs&#58;</div>
          <div className={cs.description}>{clearlabs ? "Yes" : "No"}</div>
        </div>
      )}
      <div className={cs.item}>
        <div className={cs.subheader}>Wetlab Protocol&#58;</div>
        <div className={cs.description}>
          {CG_WETLAB_DISPLAY_NAMES[wetlabProtocol]}
        </div>
      </div>
      {technology === SEQUENCING_TECHNOLOGY_OPTIONS.NANOPORE && (
        <div className={cs.item}>
          <div className={cs.subheader}>Medaka Model&#58;</div>
          <div className={cs.description}>{medakaModel}</div>
        </div>
      )}
    </>
  );
};
