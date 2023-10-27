import React, { useContext } from "react";
import { saveVisualization } from "~/api";
import { UserContext } from "~/components/common/UserContext";
import { SaveButton } from "~/components/ui/controls/buttons";
import { WorkflowType } from "~/components/utils/workflows";
import { parseUrlParams } from "~/helpers/url";
import { SampleViewSaveButtonConfig } from "./workflowTypeConfig";

interface SampleViewSaveButtonProps {
  view: string;
  sampleId: number;
  isHidden?: boolean;
  className?: string;
  workflow: WorkflowType;
}

export const SampleViewSaveButton = ({
  view,
  sampleId,
  className,
  workflow,
}: SampleViewSaveButtonProps) => {
  const onSaveClick = async () => {
    if (view) {
      const params = parseUrlParams();
      params.sampleIds = sampleId;
      await saveVisualization(view, params);
    }
  };
  const isVisible = SampleViewSaveButtonConfig[workflow];
  const { admin: userIsAdmin } = useContext(UserContext) || {};
  if (!userIsAdmin || !isVisible) return <></>;
  return <SaveButton className={className} onClick={onSaveClick} />;
};
