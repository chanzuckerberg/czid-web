import React, { useContext } from "react";
import { ANALYTICS_EVENT_NAMES } from "~/api/analytics";
import { UserContext } from "~/components/common/UserContext";
import { MNGS_NANOPORE_PIPELINE_GITHUB_LINK } from "~/components/utils/documentationLinks";
import { ONT_V1_HARD_LAUNCH_FEATURE } from "~/components/utils/features";
import { SEQUENCING_TECHNOLOGY_OPTIONS } from "../../../../../constants";
import { SequencingPlatformOption } from "../../../SequencingPlatformOption";
import { MetagenomicsNanoporeSettings } from "./components/MetagenomicsNanoporeSettings";

interface MetagenomicsWithNanoporeProps {
  isDisabled: boolean;
  isSelected: boolean;
  onClick(): void;
  selectedGuppyBasecallerSetting: string;
  onChangeGuppyBasecallerSetting(selected: string): void;
}

const MetagenomicsWithNanopore = ({
  isDisabled,
  isSelected,
  onClick,
  selectedGuppyBasecallerSetting,
  onChangeGuppyBasecallerSetting,
}: MetagenomicsWithNanoporeProps) => {
  const userContext = useContext(UserContext);
  const { allowedFeatures } = userContext || {};

  const tooltipText = "This pipeline only supports upload from your computer.";

  return (
    <SequencingPlatformOption
      analyticsEventName={
        ANALYTICS_EVENT_NAMES.UPLOAD_SAMPLE_STEP_MNGS_NANOPORE_PIPELINE_LINK_CLICKED
      }
      githubLink={MNGS_NANOPORE_PIPELINE_GITHUB_LINK}
      isBeta={!allowedFeatures.includes(ONT_V1_HARD_LAUNCH_FEATURE)}
      isDisabled={isDisabled}
      isSelected={isSelected}
      onClick={onClick}
      technologyName="Nanopore"
      technologyDetails={
        <MetagenomicsNanoporeSettings
          selectedGuppyBasecallerSetting={selectedGuppyBasecallerSetting}
          onChangeGuppyBasecallerSetting={onChangeGuppyBasecallerSetting}
        />
      }
      testId={SEQUENCING_TECHNOLOGY_OPTIONS.NANOPORE}
      tooltipText={tooltipText}
    />
  );
};

export { MetagenomicsWithNanopore };
