import React from "react";
import { ANALYTICS_EVENT_NAMES } from "~/api/analytics";
import ExternalLink from "~/components/ui/controls/ExternalLink";
import { showToast } from "~/components/utils/toast";
import Notification from "~ui/notifications/Notification";
import cs from "./blast_notification.scss";
import { NCBI_SUPPORT_CENTER_LINK } from "./constants";

export const showBlastNotification = () => {
  showToast(({ closeToast }) => <BlastNotification onClose={closeToast} />);
};

export const BlastNotification = ({ onClose }: { onClose?: () => void }) => {
  const label = (
    <div className={cs.label}>
      <div className={cs.message}>
        Your sequences were successfuly sent to NCBI. If you encounter issues
        once the sequences have left CZ ID, please check out the{" "}
        <ExternalLink
          analyticsEventName={
            ANALYTICS_EVENT_NAMES.BLAST_NOTIFICATION_NCBI_SUPPORT_CENTER_LINK_CLICKED
          }
          coloredBackground
          href={NCBI_SUPPORT_CENTER_LINK}
        >
          NCBI Support Center
        </ExternalLink>
        .
      </div>
    </div>
  );

  return (
    <Notification displayStyle="elevated" type="info" onClose={onClose}>
      {label}
    </Notification>
  );
};
