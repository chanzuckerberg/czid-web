import { Notification } from "@czi-sds/components";
import React from "react";
import { pluralize } from "~/components/utils/stringUtil";
import { WorkflowLabelType } from "~/components/utils/workflows";

interface DeleteSuccessNotificationProps {
  onClose(): void;
  sampleCount: number;
  workflowLabel: WorkflowLabelType;
}

const DeleteSuccessNotification = ({
  onClose,
  sampleCount,
  workflowLabel,
}: DeleteSuccessNotificationProps) => (
  <div data-testid="sample-delete-success-notif">
    <Notification
      intent="info"
      onClose={onClose}
      buttonText="dismiss"
      buttonOnClick={onClose}
      slideDirection="right"
    >
      {sampleCount} {workflowLabel} {pluralize("run", sampleCount)}{" "}
      {pluralize("was", sampleCount)} successfully deleted.
    </Notification>
  </div>
);

export { DeleteSuccessNotification };
