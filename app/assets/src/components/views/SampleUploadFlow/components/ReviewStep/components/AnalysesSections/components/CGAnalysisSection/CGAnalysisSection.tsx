import React from "react";
import {
  CG_WETLAB_DISPLAY_NAMES,
  SEQUENCING_TECHNOLOGY_OPTIONS,
  Technology,
  UploadWorkflows,
  UPLOAD_WORKFLOWS,
} from "~/components/views/SampleUploadFlow/constants";
import cs from "~/components/views/SampleUploadFlow/sample_upload_flow.scss";

interface CGAnalysisSectionType {
  clearlabs: boolean;
  medakaModel: string;
  technology: Technology;
  wetlabProtocol: string;
  workflows: Set<UploadWorkflows>;
}

const CGAnalysisSection = ({
  clearlabs,
  medakaModel,
  technology,
  wetlabProtocol,
  workflows,
}: CGAnalysisSectionType) => {
  return (
    <>
      {technology === SEQUENCING_TECHNOLOGY_OPTIONS.NANOPORE && (
        <div className={cs.item}>
          <div className={cs.subheader}>Used Clear Labs&#58;</div>
          <div className={cs.description}>{clearlabs ? "Yes" : "No"}</div>
        </div>
      )}
      {workflows.has(UPLOAD_WORKFLOWS.COVID_CONSENSUS_GENOME.value) && (
        <div className={cs.item}>
          <div className={cs.subheader}>Wetlab Protocol&#58;</div>
          <div className={cs.description}>
            {CG_WETLAB_DISPLAY_NAMES[wetlabProtocol]}
          </div>
        </div>
      )}
      <div className={cs.item}>
        {technology === SEQUENCING_TECHNOLOGY_OPTIONS.NANOPORE && (
          <>
            <div className={cs.subheader}>Medaka Model&#58;</div>
            <div className={cs.description}>{medakaModel}</div>
          </>
        )}
      </div>
    </>
  );
};

export { CGAnalysisSection };
