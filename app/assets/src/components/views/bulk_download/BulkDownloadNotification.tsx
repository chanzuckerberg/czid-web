import React from "react";
import { trackEvent } from "~/api/analytics";
import { UserContext } from "~/components/common/UserContext";
import { showToast } from "~/components/utils/toast";
import Notification from "~ui/notifications/Notification";
import cs from "./bulk_download_notification.scss";

interface BulkDownloadNotificationProps {
  onClose?: $TSFixMeFunction;
}

export default class BulkDownloadNotification extends React.Component<BulkDownloadNotificationProps> {
  render() {
    const { onClose } = this.props;
    const { admin, userName } = this.context || {};

    const label = (
      <div className={cs.label}>
        <div className={cs.message}>
          We&apos;ve received your download request and are busy preparing your
          data. To check the status of your download, visit the{" "}
          <a
            href={
              !admin
                ? "/bulk_downloads"
                : `/bulk_downloads?searchBy=${userName}&n=10`
            }
            onClick={() =>
              trackEvent("BulkDownloadNotification_downloads-page-link-clicked")
            }
          >
            Downloads page
          </a>
          .
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
