import React from "react";
import { UserContext } from "~/components/common/UserContext";
import { showToast } from "~/components/utils/toast";
import Notification from "~ui/notifications/Notification";
import cs from "./bulk_download_notification.scss";

interface BulkDownloadNotificationProps {
  onClose?: $TSFixMeFunction;
}

class BulkDownloadNotification extends React.Component<BulkDownloadNotificationProps> {
  render() {
    const { onClose } = this.props;

    const label = (
      <div className={cs.label}>
        <div className={cs.message}>
          We&apos;ve received your download request and are busy preparing your
          data. To check the status of your download, visit the{" "}
          <a href="/bulk_downloads">Downloads page</a>.
        </div>
      </div>
    );

    return (
      <Notification displayStyle="elevated" type="info" onClose={onClose}>
        {label}
      </Notification>
    );
  }
}

export const showBulkDownloadNotification = () => {
  showToast(
    ({ closeToast }) => <BulkDownloadNotification onClose={closeToast} />,
    {
      autoClose: 12000,
    },
  );
};

BulkDownloadNotification.contextType = UserContext;
