import React from "react";
import PropTypes from "prop-types";
import { get, find } from "lodash/fp";
import cx from "classnames";

import PrimaryButton from "~/components/ui/controls/buttons/PrimaryButton";
import { createBulkDownload } from "~/api/bulk_downloads";
import AlertIcon from "~ui/icons/AlertIcon";
import CircleCheckmarkIcon from "~ui/icons/CircleCheckmarkIcon";
import LoadingIcon from "~ui/icons/LoadingIcon";

import cs from "./review_step.scss";

class ReviewStep extends React.Component {
  state = {
    // Whether we are waiting for the createBulkDownload call to complete.
    waitingForCreate: false,
    createStatus: null,
    createError: "",
  };

  createBulkDownload = async () => {
    const { selectedDownload } = this.props;
    this.setState({
      waitingForCreate: true,
    });

    try {
      await createBulkDownload(selectedDownload);
    } catch (e) {
      this.setState({
        waitingForCreate: false,
        createStatus: "error",
        createError: e.error,
      });
      return;
    }

    this.setState({
      waitingForCreate: false,
      createStatus: "success",
    });
  };

  backLinkEnabled = () =>
    !this.state.waitingForCreate && this.state.createStatus === null;

  renderDownloadField = (field, value) => {
    const { downloadType } = this.props;
    const fieldDisplayName =
      get("display_name", find(["type", field], downloadType.fields)) || "";

    return (
      <div className={cs.field} key={field}>
        <div className={cs.name}>{fieldDisplayName}</div>
        <div className={cs.value}>{value}</div>
      </div>
    );
  };

  renderFooter = () => {
    const { waitingForCreate, createStatus, createError } = this.state;

    if (waitingForCreate) {
      return (
        <div className={cs.loadingMessage}>
          <LoadingIcon className={cs.icon} />
          <div className={cs.text}>Starting your download...</div>
        </div>
      );
    }

    if (createStatus === "error") {
      return (
        <div className={cs.errorMessage}>
          <AlertIcon className={cs.icon} />
          <div className={cs.text}> {createError}</div>
        </div>
      );
    }

    if (createStatus === "success") {
      return (
        <React.Fragment>
          <div className={cs.successMessage}>
            <CircleCheckmarkIcon className={cs.icon} />
            <div className={cs.text}>
              Your download was successfully submitted. We&apos;ll send you an
              email when your files are ready.
            </div>
          </div>
          <PrimaryButton text="View Your Past Downloads" />
        </React.Fragment>
      );
    }

    return (
      <React.Fragment>
        <PrimaryButton
          text="Start Generating Download"
          onClick={this.createBulkDownload}
        />
        <div className={cs.downloadDisclaimer}>
          Downloads for larger files can take multiple hours to generate.
        </div>
      </React.Fragment>
    );
  };

  render() {
    const { selectedDownload, downloadType, onBackClick } = this.props;

    return (
      <div className={cs.reviewStep}>
        <div className={cs.header}>
          <div className={cs.title}>Review Your Download</div>
          <div
            className={cx(cs.editLink, this.backLinkEnabled() && cs.enabled)}
            onClick={this.backLinkEnabled() ? onBackClick : undefined}
          >
            Edit download
          </div>
        </div>
        <div className={cs.selectedDownload}>
          <div className={cs.title}>
            <div className={cs.name}>{downloadType.display_name}</div>
            <div className={cs.numSamples}>
              &nbsp;for {selectedDownload.sampleIds.length} samples
            </div>
          </div>
          {selectedDownload.fields && (
            <div className={cs.fields}>
              {Object.entries(selectedDownload.fields).map(([key, value]) =>
                this.renderDownloadField(key, value)
              )}
            </div>
          )}
        </div>
        <div className={cs.footer}>{this.renderFooter()}</div>
      </div>
    );
  }
}

ReviewStep.propTypes = {
  selectedDownload: PropTypes.shape({
    downloadType: PropTypes.string.isRequired,
    fields: PropTypes.object,
    sampleIds: PropTypes.arrayOf(PropTypes.number).isRequired,
  }).isRequired,
  downloadType: PropTypes.shape({
    type: PropTypes.string,
    display_name: PropTypes.string,
    description: PropTypes.string,
    category: PropTypes.string,
    fields: PropTypes.arrayOf(
      PropTypes.shape({
        type: PropTypes.string,
        display_name: PropTypes.string,
      })
    ),
  }),
  onBackClick: PropTypes.func.isRequired,
};

export default ReviewStep;
