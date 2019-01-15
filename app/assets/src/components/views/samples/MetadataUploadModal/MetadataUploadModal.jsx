// This modal contains a wizard that allows users to upload metadata to a project.
import React from "react";
import PropTypes from "prop-types";
import Wizard from "~ui/containers/Wizard";
import Modal from "~ui/containers/Modal";
import { uploadMetadataForProject } from "~/api";
import ReviewPage from "./ReviewPage";
import UploadPage from "./UploadPage";
import cs from "./metadata_upload_modal.scss";

class MetadataUploadModal extends React.Component {
  state = {
    metadata: null,
    issues: null,
    hasIssues: false
  };

  handleMetadataChange = ({ metadata, issues }) => {
    this.setState({
      metadata,
      issues
    });
  };

  handleComplete = () => {
    uploadMetadataForProject(this.props.project.id, this.state.metadata.rows);
    this.props.onClose();
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
        onClose={this.props.onClose}
        className={cs.metadataUploadModal}
      >
        <Wizard onComplete={this.handleComplete}>{this.getPages()}</Wizard>
      </Modal>
    );
  }
}

MetadataUploadModal.propTypes = {
  onClose: PropTypes.func,
  project: PropTypes.shape({
    id: PropTypes.number,
    name: PropTypes.string
  })
};

export default MetadataUploadModal;
