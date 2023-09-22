import { isEmpty, size } from "lodash/fp";
import React, { useContext } from "react";
import { UserContext } from "~/components/common/UserContext";
import { HelpButton } from "~/components/ui/controls/buttons";
import { showAppcue } from "~/components/utils/appcues";
import { WorkflowType } from "~/components/utils/workflows";
import Sample from "~/interface/sample";
import { SampleViewHelpButtonConfig } from "./workflowTypeConfig";

interface SampleViewHelpButtonProps {
  workflow: WorkflowType;
  className: string;
  sample: Sample;
}

export const SampleViewHelpButton = ({
  workflow,
  className,
  sample,
}: SampleViewHelpButtonProps) => {
  const { allowedFeatures } = useContext(UserContext) || {};
  const shouldHideConsensusGenomeHelpButton =
    // CG help button should only be shown if feature flag is on
    // unless the sample has 0 mNGS runs & exactly 1 CG run.
    // This logic was implemented to differentiate the SC2 panel vs the generalized viral panel
    // for more context see: https://czi-sci.slack.com/archives/C043DHEH6FM/p1679518401997839
    !allowedFeatures.includes("cg_appcues_help_button") ||
    (sample &&
      isEmpty(sample?.pipeline_runs) &&
      size(sample?.workflow_runs) === 1);
  const { isVisible, flowId, analyticEventName } =
    SampleViewHelpButtonConfig[workflow];
  if (!isVisible || shouldHideConsensusGenomeHelpButton) return;
  return (
    <HelpButton
      className={className}
      onClick={showAppcue({
        flowId,
        analyticEventName,
      })}
    />
  );
};
