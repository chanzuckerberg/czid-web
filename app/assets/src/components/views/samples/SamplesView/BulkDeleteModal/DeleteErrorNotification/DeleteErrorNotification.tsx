import { Link, Notification } from "@czi-sds/components";
import React from "react";
import { CONTACT_US_LINK } from "~/components/utils/documentationLinks";
import { pluralize } from "~/components/utils/stringUtil";
import { WorkflowLabelType } from "~/components/utils/workflows";

interface DeleteSuccessNotificationProps {
  onClose(): void;
  sampleCount: number | null;
  workflowLabel: WorkflowLabelType;
}

const DeleteErrorNotification = ({
  onClose,
  sampleCount,
  workflowLabel,
}: DeleteSuccessNotificationProps) => (
  <div data-testid="sample-delete-error-notif">
    <Notification
      intent="error"
      onClose={onClose}
      buttonText="dismiss"
      buttonOnClick={onClose}
      slideDirection="right"
    >
      {typeof sampleCount === "number"
        ? `${sampleCount} ${workflowLabel} ${pluralize(
            "run",
            sampleCount,
          )} failed to
      delete.`
        : "One or more runs failed to delete."}{" "}
      Please try again. If the problem persists, please contact us at{" "}
      <Link sdsStyle="dashed" href={CONTACT_US_LINK} target="_blank">
        our Help Center
      </Link>
      .
    </Notification>
  </div>
);

export { DeleteErrorNotification };
