import { compact, filter, get, isEmpty, pullAll } from "lodash/fp";
import React, { useContext } from "react";
import { UserContext } from "~/components/common/UserContext";
import { BULK_DELETION_FEATURE } from "~/components/utils/features";
import {
  getShorthandFromWorkflow,
  WORKFLOW_ENTITIES,
  WORKFLOW_VALUES,
} from "~/components/utils/workflows";
import { ObjectType } from "~/interface/samplesView";
import cs from "../samples_view.scss";
import ToolbarButtonIcon from "../ToolbarButtonIcon";

interface BulkDeleteTriggerProps {
  onClick(): void;
  selectedObjects: ObjectType[];
  workflow: WORKFLOW_VALUES;
  workflowEntity: string;
}

const BulkDeleteTrigger = ({
  onClick,
  selectedObjects,
  workflow,
  workflowEntity,
}: BulkDeleteTriggerProps) => {
  const { allowedFeatures, userId } = useContext(UserContext) ?? {};

  // if feature flag off, show nothing
  if (!allowedFeatures.includes(BULK_DELETION_FEATURE)) {
    return null;
  }

  const isAtLeastOneObjectValidForDeletion = () => {
    // selected samples uploaded by current user
    const filteredSamples = filter(obj => {
      const uploadedBy = obj.sample?.userId;
      return uploadedBy === userId;
    }, selectedObjects);

    // if user didn't upload any of the selected samples,
    // we can return false without checking if any of them completed,
    // since the user can't delete these anyway
    if (!filteredSamples) return false;

    // Allow deletion if a sample failed to upload
    // Upload error returned by the backend is nil if the upload has stalled
    // so this section will correctly not allow it to be deleted
    const uploadErrors = compact(
      filteredSamples.map(object => get(["sample", "uploadError"], object)),
    );
    if (!isEmpty(uploadErrors)) {
      return true;
    }

    // if user uploaded something, check if any of the ones they uploaded completed
    if (workflowEntity === WORKFLOW_ENTITIES.WORKFLOW_RUNS) {
      const runStatuses = filteredSamples.map(object =>
        get(["status"], object),
      );
      return !isEmpty(pullAll(["running", "created"], runStatuses));
    }

    const statuses = filteredSamples.map(object =>
      get(["sample", "pipelineRunFinalized"], object),
    );

    return statuses.includes(1);
  };

  let disabled = false;
  let disabledMessage = "";
  let shouldInvertTooltip = true;
  let primaryText = `Delete ${getShorthandFromWorkflow(workflow)} Run`;

  // disabled because no samples selected in table
  if (selectedObjects?.length === 0) {
    disabled = true;
    disabledMessage = "Select at least 1 sample";
    // disabled because all selected samples cannot be deleted by this user at this time
  } else if (!isAtLeastOneObjectValidForDeletion()) {
    disabled = true;
    shouldInvertTooltip = false;
    primaryText = "";
    disabledMessage =
      "The Selected Samples can’t be deleted because they were all run by another user or are still being processed.";
  }

  return (
    <ToolbarButtonIcon
      className={cs.action}
      icon="trashCan"
      disabled={disabled}
      popupSubtitle={disabledMessage}
      popupText={primaryText}
      onClick={onClick}
      inverted={shouldInvertTooltip}
      testId="bulk-delete-trigger"
    />
  );
};

export { BulkDeleteTrigger };
