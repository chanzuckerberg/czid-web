import PropTypes from "prop-types";
import React from "react";

import { ANALYTICS_EVENT_NAMES, logAnalyticsEvent } from "~/api/analytics";
import { showToast } from "~/components/utils/toast";
import Notification from "~ui/notifications/Notification";

import cs from "./phylo_tree_notification.scss";

const PhyloTreeNotification = ({ onClose }) => {
  const label = (
    <div className={cs.label}>
      <div className={cs.message}>
        Hang tight and grab a cup of coffee while we generate your tree!
        <div className={cs.visualizationsLink}>
          <a
            href="/my_data?currentTab=visualizations"
            onClick={() => {
              onClose();
              logAnalyticsEvent(
                ANALYTICS_EVENT_NAMES.PHYLO_TREE_NOTIFICATION_VIEW_VISUALIZATIONS_LINK_CLICKED,
              );
            }}
          >
            View Visualizations
          </a>
        </div>
      </div>
    </div>
  );

  return (
    <Notification
      closeWithDismiss={false}
      displayStyle="elevated"
      type="info"
      onClose={onClose}
    >
      {label}
    </Notification>
  );
};

PhyloTreeNotification.propTypes = {
  onClose: PropTypes.func,
};

export default PhyloTreeNotification;

export const showPhyloTreeNotification = () => {
  showToast(
    ({ closeToast }) => <PhyloTreeNotification onClose={closeToast} />,
    {
      autoClose: 12000,
    },
  );
};
