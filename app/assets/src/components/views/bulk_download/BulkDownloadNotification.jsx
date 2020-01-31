import React from "react";
import PropTypes from "prop-types";

import { showToast } from "~/components/utils/toast";
import Notification from "~ui/notifications/Notification";

import cs from "./bulk_download_notification.scss";

export default class BulkDownloadNotification extends React.Component {
  render() {
    const { onClose } = this.props;

    const label = (
      <div className={cs.label}>
        <div className={cs.message}>
          You've requested a download. We are processing it now. It may take
          some time to finish.
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
        onClose={onClose}
      >
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
    }
  );
};

BulkDownloadNotification.propTypes = {
  onClose: PropTypes.func,
};
