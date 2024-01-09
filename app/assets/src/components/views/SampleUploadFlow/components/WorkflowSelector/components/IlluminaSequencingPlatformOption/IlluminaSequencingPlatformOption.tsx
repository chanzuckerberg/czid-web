import React from "react";
import { ANALYTICS_EVENT_NAMES } from "~/api/analytics";
import {
  CG_ILLUMINA_PIPELINE_GITHUB_LINK,
  MNGS_ILLUMINA_PIPELINE_GITHUB_LINK,
} from "~/components/utils/documentationLinks";
import cs from "~/components/views/SampleUploadFlow/components/WorkflowSelector/workflow_selector.scss";
import { SEQUENCING_TECHNOLOGY_OPTIONS } from "../../../../constants";
import { SequencingPlatformOption } from "../SequencingPlatformOption";
import { WetlabSelector } from "../WetlabSelector";

interface IlluminaSequencingPlatformOptionProps {
  indexVersion?: string;
  isCg: boolean;
  isSelected: boolean;
  onClick(): void;
  onWetlabProtocolChange?(value: string): void;
  selectedWetlabProtocol?: string;
  pipelineVersion?: string;
  latestMajorPipelineVersion?: string;
  latestMajorIndexVersion?: string;
  versionHelpLink: string;
  warningHelpLink: string;
}

const IlluminaSequencingPlatformOption = ({
  indexVersion,
  isCg,
  isSelected,
  onClick,
  onWetlabProtocolChange,
  selectedWetlabProtocol,
  pipelineVersion,
  latestMajorPipelineVersion,
  latestMajorIndexVersion,
  versionHelpLink,
  warningHelpLink,
}: IlluminaSequencingPlatformOptionProps) => {
  const {
    UPLOAD_SAMPLE_STEP_MNGS_ILLUMINA_PIPELINE_LINK_CLICKED,
    UPLOAD_SAMPLE_CG_ILLUMINA_PIPELINE_GITHUB_LINK_CLICKED,
  } = ANALYTICS_EVENT_NAMES;

  return (
    <SequencingPlatformOption
      analyticsEventName={
        !isCg
          ? UPLOAD_SAMPLE_STEP_MNGS_ILLUMINA_PIPELINE_LINK_CLICKED
          : UPLOAD_SAMPLE_CG_ILLUMINA_PIPELINE_GITHUB_LINK_CLICKED
      }
      githubLink={
        !isCg
          ? MNGS_ILLUMINA_PIPELINE_GITHUB_LINK
          : CG_ILLUMINA_PIPELINE_GITHUB_LINK
      }
      isSelected={isSelected}
      onClick={onClick}
      indexVersion={indexVersion}
      showIndexVersion={!isCg}
      technologyName="Illumina"
      technologyDetails={
        isCg &&
        isSelected && (
          <div className={cs.item}>
            <div className={cs.subheader}>Wetlab Protocol:</div>
            <WetlabSelector
              // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2322
              selectedWetlabProtocol={selectedWetlabProtocol}
              // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2322
              onWetlabProtocolChange={onWetlabProtocolChange}
              technology={SEQUENCING_TECHNOLOGY_OPTIONS.ILLUMINA}
            />
          </div>
        )
      }
      testId={SEQUENCING_TECHNOLOGY_OPTIONS.ILLUMINA}
      pipelineVersion={pipelineVersion}
      latestMajorPipelineVersion={latestMajorPipelineVersion}
      latestMajorIndexVersion={latestMajorIndexVersion}
      versionHelpLink={versionHelpLink}
      warningHelpLink={warningHelpLink}
    />
  );
};

export { IlluminaSequencingPlatformOption };
