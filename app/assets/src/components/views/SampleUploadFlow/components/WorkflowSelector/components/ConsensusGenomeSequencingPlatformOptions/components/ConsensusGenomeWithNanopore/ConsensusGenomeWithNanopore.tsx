import React from "react";
import { ANALYTICS_EVENT_NAMES } from "~/api/analytics";
import { ARTIC_PIPELINE_LINK } from "~/components/utils/documentationLinks";
import {
  SEQUENCING_TECHNOLOGY_OPTIONS,
  UploadWorkflows,
} from "../../../../../../constants";
import { WorkflowLinksConfig } from "../../../../workflowTypeConfig";
import { SequencingPlatformOption } from "../../../SequencingPlatformOption";
import { ConsensusGenomeNanoporeSettings } from "./components/ConsensusGenomeNanoporeSettings";

interface ConsensusGenomeWithNanoporeProps {
  isDisabled: boolean;
  isSelected: boolean;
  isS3UploadEnabled: boolean;
  onClick(): void;
  onClearLabsChange(toggle: boolean): void;
  onMedakaModelChange(value: string): void;
  selectedMedakaModel: string;
  usedClearLabs: boolean;
  onWetlabProtocolChange(value: string): void;
  selectedWetlabProtocol: string;
  pipelineVersion?: string;
  latestMajorPipelineVersion?: string;
}

const ConsensusGenomeWithNanopore = ({
  isDisabled,
  isSelected,
  isS3UploadEnabled,
  onClick,
  onClearLabsChange,
  onMedakaModelChange,
  selectedMedakaModel,
  usedClearLabs,
  onWetlabProtocolChange,
  selectedWetlabProtocol,
  pipelineVersion,
  latestMajorPipelineVersion,
}: ConsensusGenomeWithNanoporeProps) => {
  const tooltipText = `This pipeline only supports upload from your computer${
    isS3UploadEnabled ? " or S3" : ""
  }.`;

  const { pipelineVersionLink, warningLink } =
    WorkflowLinksConfig[UploadWorkflows.COVID_CONSENSUS_GENOME];

  return (
    <SequencingPlatformOption
      analyticsEventName={
        ANALYTICS_EVENT_NAMES.UPLOAD_SAMPLE_STEP_CG_ARTIC_PIPELINE_LINK_CLICKED
      }
      customDescription="We are using the ARTIC network’s nCoV-2019 novel coronavirus bioinformatics protocol for nanopore sequencing, which can be found "
      githubLink={ARTIC_PIPELINE_LINK}
      isDisabled={isDisabled}
      isSelected={isSelected}
      onClick={onClick}
      showIndexVersion={false}
      technologyName="Nanopore"
      technologyDetails={
        <ConsensusGenomeNanoporeSettings
          onClearLabsChange={onClearLabsChange}
          onMedakaModelChange={onMedakaModelChange}
          selectedMedakaModel={selectedMedakaModel}
          usedClearLabs={usedClearLabs}
          selectedWetlabProtocol={selectedWetlabProtocol}
          onWetlabProtocolChange={onWetlabProtocolChange}
        />
      }
      testId={SEQUENCING_TECHNOLOGY_OPTIONS.NANOPORE}
      tooltipText={tooltipText}
      pipelineVersion={pipelineVersion}
      latestMajorPipelineVersion={latestMajorPipelineVersion}
      versionHelpLink={pipelineVersionLink}
      warningHelpLink={warningLink}
    />
  );
};

export { ConsensusGenomeWithNanopore };
