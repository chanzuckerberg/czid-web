import React from "react";
import {
  SEQUENCING_TECHNOLOGY_OPTIONS,
  Technology,
} from "~/components/views/SampleUploadFlow/constants";
import cs from "~/components/views/SampleUploadFlow/sample_upload_flow.scss";

interface MNGSAnalysisSectionType {
  technology: Technology;
  guppyBasecallerSetting: string;
}

const MNGSAnalysisSection = ({
  technology,
  guppyBasecallerSetting,
}: MNGSAnalysisSectionType) => (
  <>
    {technology === SEQUENCING_TECHNOLOGY_OPTIONS.NANOPORE && (
      <>
        <div className={cs.item}>
          <div className={cs.subheader}>{"Guppy Basecaller Setting: "}</div>
          <div className={cs.description}>{guppyBasecallerSetting}</div>
        </div>
      </>
    )}
  </>
);

export { MNGSAnalysisSection };
