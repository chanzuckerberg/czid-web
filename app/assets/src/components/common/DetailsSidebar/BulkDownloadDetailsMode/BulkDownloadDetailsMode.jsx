import React from "react";
import PropTypes from "prop-types";

import { getBulkDownload } from "~/api/bulk_downloads";
import ExternalLink from "~/components/ui/controls/ExternalLink";
import Tabs from "~/components/ui/controls/Tabs";
import { UserContext } from "~/components/common/UserContext";
import { logAnalyticsEvent } from "~/api/analytics";
import Notification from "~ui/notifications/Notification";

import AdvancedDownloadTab from "./AdvancedDownloadTab";
import DetailsTab from "./DetailsTab";
import cs from "./bulk_download_details_mode.scss";

const TABS = ["Details", "Advanced Download"];

export default class BulkDownloadDetailsMode extends React.Component {
  state = {
    loading: true,
    currentTab: TABS[0],
    bulkDownloadDetails: null,
    downloadType: null,
  };

  componentDidMount() {
    this.fetchBulkDownload(this.props.bulkDownload.id);
  }

  async componentDidUpdate(prevProps) {
    if (
      this.props.bulkDownload &&
      prevProps.bulkDownload !== this.props.bulkDownload
    ) {
      this.setState({
        loading: true,
      });

      this.fetchBulkDownload(this.props.bulkDownload.id);
    }
  }

  fetchBulkDownload = async bulkDownloadId => {
    const {
      bulk_download: bulkDownloadDetails,
      download_type: downloadType,
    } = await getBulkDownload(bulkDownloadId);

    // Guard against possible race conditions.
    if (bulkDownloadDetails.id === bulkDownloadId) {
      this.setState({
        bulkDownloadDetails,
        downloadType,
        loading: false,
      });
    }
  };

  onTabChange = tab => {
    this.setState({ currentTab: tab });
    logAnalyticsEvent("bulkDownloadDetailsMode_tab_changed", {
      bulkDownloadId: this.props.bulkDownload.id,
      tab,
    });
  };

  renderNotifications = () => {
    const { bulkDownloadDetails } = this.state;

    if (bulkDownloadDetails.status === "error") {
      return (
        <Notification
          type="error"
          displayStyle="flat"
          className={cs.notification}
        >
          There was an error generating your download files. Please contact us
          for help.
        </Notification>
      );
    }

    if (
      bulkDownloadDetails.status === "success" &&
      bulkDownloadDetails.error_message
    ) {
      return (
        <Notification
          type="warn"
          displayStyle="flat"
          className={cs.notification}
        >
          {bulkDownloadDetails.error_message}
        </Notification>
      );
    }

    return null;
  };

  renderTab = () => {
    const { bulkDownloadDetails, downloadType } = this.state;

    if (this.state.currentTab === "Details") {
      return (
        <DetailsTab
          bulkDownload={bulkDownloadDetails}
          downloadType={downloadType}
        />
      );
    }
    if (this.state.currentTab === "Advanced Download") {
      return (
        <AdvancedDownloadTab
          bulkDownload={bulkDownloadDetails}
          downloadType={downloadType}
        />
      );
    }
    return null;
  };

  render() {
    const { bulkDownloadDetails, loading } = this.state;
    const { admin } = this.context || {};

    return (
      <div className={cs.content}>
        {loading ? (
          <div className={cs.loadingMsg}>Loading...</div>
        ) : (
          <div className={cs.title}>{bulkDownloadDetails.download_name}</div>
        )}
        {!loading &&
          admin && (
            <div className={cs.adminDetails}>
              ID: {bulkDownloadDetails.id}, run in:{" "}
              {bulkDownloadDetails.execution_type}
              {bulkDownloadDetails.log_url && (
                <span>
                  ,{" "}
                  <ExternalLink
                    className={cs.logUrl}
                    href={bulkDownloadDetails.log_url}
                  >
                    log url
                  </ExternalLink>
                </span>
              )}
            </div>
          )}
        {!loading && this.renderNotifications()}
        {!loading && (
          <Tabs
            className={cs.tabs}
            tabs={TABS}
            value={this.state.currentTab}
            onChange={this.onTabChange}
          />
        )}
        {!loading && this.renderTab()}
      </div>
    );
  }
}

BulkDownloadDetailsMode.propTypes = {
  bulkDownload: PropTypes.shape({
    id: PropTypes.number,
  }),
};

BulkDownloadDetailsMode.contextType = UserContext;
