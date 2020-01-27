import React from "react";

import { showToast } from "~/components/utils/toast";
import Notification from "~ui/notifications/Notification";

import cs from "./bulk_download_notification.scss";

export default class BulkDownloadNotification extends React.Component {
  render() {
    const label = (
      <div className={cs.label}>
        <div className={cs.message}>
          You've requested a download. We are processing it now. It may take
          some time, so we will notify you by email when it's done!
        </div>
        <div className={cs.footer}>
          <a className={cs.downloadsLink} href="bulk_downloads">
            View Downloads
          </a>
        </div>
      </div>
    );

    return (
      <Notification
        className={cs.publicSampleNotification}
        displayStyle="elevated"
        type="info"
      >
        {label}
      </Notification>
    );
  }
}

export const showBulkDownloadNotification = () => {
  showToast(({ closeToast }) => <BulkDownloadNotification />, {
    autoClose: 12000,
  });
};
