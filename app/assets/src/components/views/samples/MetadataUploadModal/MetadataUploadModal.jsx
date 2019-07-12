// This modal contains a wizard that allows users to upload metadata to a project.
import React from "react";
import { keyBy, flow, mapValues, omit } from "lodash/fp";
import PropTypes from "prop-types";

import Wizard from "~ui/containers/Wizard";
import Modal from "~ui/containers/Modal";
import Notification from "~ui/notifications/Notification";
import { getSamplesV1 } from "~/api";
import { uploadMetadataForProject } from "~/api/metadata";
import { logAnalyticsEvent, withAnalytics } from "~/api/analytics";
import { showToast } from "~/components/utils/toast";
import ListNotification from "~ui/notifications/ListNotification";

import ReviewPage from "./ReviewPage";
import UploadPage from "./UploadPage";
import cs from "./metadata_upload_modal.scss";

class MetadataUploadModal extends React.Component {
  state = {
    metadata: null,
    issues: null,
    projectSamples: null,
  };

  async componentDidMount() {
    const projectSamples = await getSamplesV1({
      project_id: this.props.project.id,
      basic: true,
    });

    this.setState({
      projectSamples,
    });
  }

  handleMetadataChange = ({ metadata, issues }) => {
    this.setState({
      metadata,
      issues,
    });
  };

  handleComplete = async () => {
    const { onClose, onComplete } = this.props;
    onClose();

    const response = await uploadMetadataForProject(
      this.props.project.id,
      flow(
        keyBy(row => row.sample_name || row["Sample Name"]),
        mapValues(omit(["sample_name", "Sample Name"]))
      )(this.state.metadata.rows)
    );

    if (response.errors && response.errors.length > 0) {
      showToast(({ closeToast }) => (
        <ListNotification
          className={cs.publicSampleNotification}
          onClose={closeToast}
          type="error"
          label="Your metadata upload failed with the following errors."
          listItemName="error"
          listItems={response.errors}
        />
      ));

      logAnalyticsEvent("MetadataUploadModal_modal_error", {
        projectId: this.props.project.id,
        projectSamples: this.state.projectSamples.length,
        errors: response.errors.length,
      });
    } else {
      showToast(
        ({ closeToast }) => (
          <Notification type="success" onClose={closeToast}>
            Metadata was successfully uploaded.
          </Notification>
        ),
        {
          autoClose: 3000,
        }
      );

      logAnalyticsEvent("MetadataUploadModal_modal_success", {
        projectId: this.props.project.id,
        projectSamples: this.state.projectSamples.length,
      });
    }

    onComplete && onComplete();
  };

  getPages = () => {
    const uploadTitle = (
      <span>
        Upload Metadata for{" "}
        <span className={cs.projectName}>{this.props.project.name}</span>
      </span>
    );
    const reviewTitle = (
      <span>
        Review Metadata for{" "}
        <span className={cs.projectName}>{this.props.project.name}</span>
      </span>
    );

    const uploadMetadataPage = (
      <UploadPage
        title={uploadTitle}
        key="1"
        onMetadataChange={this.handleMetadataChange}
        project={this.props.project}
        samples={this.state.projectSamples}
      />
    );

    const reviewMetadataPage = (
      <ReviewPage title={reviewTitle} key="2" metadata={this.state.metadata} />
    );

    return [uploadMetadataPage, reviewMetadataPage];
  };

  render() {
    return (
      <Modal
        open
        tall
        wide
        onClose={withAnalytics(
          this.props.onClose,
          "MetadataUploadModal_modal_closed"
        )}
        className={cs.metadataUploadModal}
      >
        <Wizard onComplete={this.handleComplete}>{this.getPages()}</Wizard>
      </Modal>
    );
  }
}

MetadataUploadModal.propTypes = {
  onClose: PropTypes.func,
  onComplete: PropTypes.func,
  project: PropTypes.shape({
    id: PropTypes.number,
    name: PropTypes.string,
  }),
};

export default MetadataUploadModal;
